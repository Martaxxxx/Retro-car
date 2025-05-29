import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import styled from "styled-components";

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
  width: 300px;
  background: white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 25px;
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

const NotificationItem = styled.div<{ read: boolean }>`
  padding: 8px 0;
  font-size: 14px;
  color: ${({ read }) => (read ? "#aaa" : "#333")};
  font-weight: ${({ read }) => (read ? "normal" : "bold")};
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

const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { text: "Nowa część została dodana do projektu.", read: false },
        { text: "Projekt Mercedes W123 został zaktualizowany.", read: false },
        { text: "Masz 2 nowe komentarze.", read: false },
    ]);

    const bellRef = useRef<HTMLDivElement>(null);
    const notificationSound = useRef<HTMLAudioElement | null>(null);

   

    // 🔒 Zamknięcie popupu po kliknięciu poza nim
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markSingleAsRead = (index: number) => {
        setNotifications(prev =>
            prev.map((n, i) => (i === index ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <BellWrapper ref={bellRef}>
            <Bell size={24} style={{ cursor: "pointer" }} onClick={() => setOpen(!open)} />
            {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            {open && (
                <Popup>
                    {notifications.map((note, i) => (
                        <NotificationItem
                            key={i}
                            read={note.read}
                            onClick={() => markSingleAsRead(i)}
                        >
                            {note.text}
                        </NotificationItem>
                    ))}
                    {unreadCount > 0 && (
                        <MarkReadButton onClick={markAllAsRead}>
                            Oznacz wszystkie jako przeczytane
                        </MarkReadButton>
                    )}
                </Popup>
            )}
        </BellWrapper>
    );
};

export default NotificationBell;
