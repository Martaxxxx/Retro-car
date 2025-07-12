import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import styled from "styled-components";
import axios from "../axios";

// --- Styled components ---
const BellWrapper = styled.div`
  position: relative;
`;

const Badge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  background: #9c2f3b;
  color: white;
  font-size: 11px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Popup = styled.div`
  position: absolute;
  top: 36px;
  right: -185px;
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 20px;
  z-index: 100;
  animation: fadeIn 0.25s ease-out both;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const NotificationItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isRead"
})<{ isRead: boolean }>`
  padding: 8px 0;
  font-size: 14px;
  color: ${({ isRead }) => (isRead ? "#aaa" : "#333")};
  font-weight: ${({ isRead }) => (isRead ? "normal" : "bold")};
  border-bottom: 1px solid #eee;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9f9f9;
  }
`;

const MarkReadButton = styled.button`
  margin-top: 12px;
  width: 100%;
  background: #9c2f3b;
  color: white;
  padding: 8px;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const ShowMoreButton = styled.button`
  margin-top: 8px;
  background: transparent;
  color: #333;
  font-size: 13px;
  border: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

// --- Types ---
type Notification = {
  id: number;
  text: string;
  read: boolean;
  created_at: string;
  project?: {
    id: number;
    name: string;
  };
  user?: {
    name: string;
    avatar?: string;
  };
};

type Props = {
  userId: number;
};

const NotificationBell: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [limit, setLimit] = useState(20);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications and REPLACE the list, do not merge
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`/api/notifications/${userId}?limit=${limit}`);
      const list = res.data?.notifications ?? [];
      setNotifications(list);
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    }
  };

  // Jeden useEffect do pobierania powiadomień i nasłuchiwania na event/update/click outside
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    // Nasłuchuj na custom event (opcjonalnie)
    const handleUpdate = () => fetchNotifications();
    window.addEventListener("notifications:update", handleUpdate);

    // Zamknij popup po kliknięciu poza dzwonkiem
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications:update", handleUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userId, limit]);

  const markSingleAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/api/notifications/${userId}/mark-single-read`, {
        notification_id: notificationId,
      });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Błąd przy oznaczaniu powiadomienia jako przeczytane:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(`/api/notifications/${userId}/mark-read`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setOpen(false);
    } catch (error) {
      console.error("Błąd oznaczania jako przeczytane:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <BellWrapper ref={bellRef}>
      <Bell
        size={24}
        style={{ cursor: "pointer" }}
        onClick={() => setOpen(prev => !prev)}
      />
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      {open && (
        <Popup>
          {notifications.length === 0 ? (
            <p>Brak powiadomień.</p>
          ) : (
            <>
              {notifications.map(note => (
                <NotificationItem
                key={note.id}
                isRead={note.read}
                onClick={() => markSingleAsRead(note.id)}
                title={note.project?.name ? `Projekt: ${note.project.name}` : ""}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minHeight: 44 }}>
                <img
  src={note.user?.avatar || "/default-avatar.png"}
  alt="avatar"
  style={{
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    background: "#eee",
    display: "block"
  }}
/>
                  <div>
                    <strong style={{ marginRight: 6 }}>
                      {note.user?.name ?? "Użytkownik"}:
                    </strong>
                    {note.text}
                    {note.project?.name && (
                      <span style={{ color: "#888", marginLeft: 6, fontSize: 12 }}>
                        [{note.project.name}]
                      </span>
                    )}
                  </div>
                </div>
              </NotificationItem>
              ))}

              {unreadCount > 0 && (
                <MarkReadButton onClick={markAllAsRead}>
                  Oznacz wszystkie jako przeczytane
                </MarkReadButton>
              )}
              {notifications.length >= limit && (
                <ShowMoreButton onClick={() => setLimit(prev => prev + 20)}>
                  Pokaż więcej
                </ShowMoreButton>
              )}
            </>
          )}
        </Popup>
      )}
    </BellWrapper>
  );
};

export default NotificationBell;