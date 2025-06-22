import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import styled from "styled-components";
import axios from "../axios";

export const statusLabels: Record<string, string> = {
  pending: "W przygotowaniu",
  ready: "Gotowy do montażu",
  installed: "Zamontowany",
};
const BellWrapper = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
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

type Notification = {
  id: number;
  text: string;
  read: boolean;
  user?: {
    name: string;
    avatar?: string; 
  };
};


const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [limit, setLimit] = useState(20);
  const bellRef = useRef<HTMLDivElement>(null);
  const userId = 2; // ⬅️ Zmień to na dynamiczne ID z AuthContext, jeśli masz

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`/notifications/${userId}?limit=${limit}`);
      const list = res.data?.notifications;
      setNotifications(prev => {
        const currentIds = prev.map(n => n.id).sort().join(',');
        const newIds = list.map((n: Notification) => n.id).sort().join(',');
        return currentIds === newIds ? prev : list;
      });
      
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, limit]);

  useEffect(() => {
    fetchNotifications(); // Od razu po załadowaniu komponentu
  
    const interval = setInterval(fetchNotifications, 2000); // Co 2 sekundy
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const handleUpdate = () => {
      fetchNotifications(); // Odśwież listę powiadomień
    };
  
    window.addEventListener("notifications:update", handleUpdate);
  
    return () => {
      window.removeEventListener("notifications:update", handleUpdate);
    };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markSingleAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/notifications/${userId}/mark-single-read`, {
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
      await axios.post(`/notifications/${userId}/mark-read`);
      await fetchNotifications(); // odśwież dane z backendu
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
        onClick={() =>
          setOpen(prev => {
            const next = !prev;
            if (next) fetchNotifications();
            return next;
          })
        }
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
>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <img
      src={note.user?.avatar || "/default-avatar.png"} // ← domyślny avatar, jeśli brak
      alt="avatar"
      style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
    />
    <div>
      <strong style={{ marginRight: 6 }}>{note.user?.name ?? "Użytkownik"}:</strong>
      {note.text}
    </div>
  </div>
</NotificationItem>

))}

              {unreadCount > 0 && (
                <MarkReadButton onClick={markAllAsRead}>
                  Oznacz wszystkie jako przeczytane
                </MarkReadButton>
              )}
              {notifications.length >= limit && unreadCount === 0 && (
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
