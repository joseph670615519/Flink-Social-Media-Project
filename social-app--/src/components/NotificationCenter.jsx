import React, { useState, useEffect } from 'react';
import { Bell, X, Heart, MessageCircle, Users } from 'lucide-react';
import './NotificationCenter.css';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

export const NotificationCenter = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        
        const fetchNotifications = async () => {
            try {
                const data = await getUserNotifications(userId);
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        // ดึงเตือนครั้งแรก
        fetchNotifications();

        // โปลเตือนทุก 3 วินาที
        const interval = setInterval(fetchNotifications, 3000);
        return () => clearInterval(interval);
    }, [userId]);

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            try {
                await markNotificationAsRead(notification.id);
                setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? {...n, read: true} : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead(userId);
            setNotifications(prev => prev.map(n => ({...n, read: true})));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'like': return <Heart size={16} style={{color: '#e74c3c'}} />;
            case 'comment': return <MessageCircle size={16} style={{color: '#3498db'}} />;
            case 'follow': return <Users size={16} style={{color: '#2ecc71'}} />;
            case 'message': return <MessageCircle size={16} style={{color: '#9b59b6'}} />;
            default: return <Bell size={16} />;
        }
    };

    const getNotificationMessage = (notification) => {
        switch(notification.type) {
            case 'like':
                return `${notification.senderName} ชอบโพสต์ของคุณ`;
            case 'comment':
                return `${notification.senderName} แสดงความคิดเห็นโพสต์ของคุณ`;
            case 'follow':
                return `${notification.senderName} ทำการติดตามคุณ`;
            case 'message':
                return `${notification.senderName} ส่งข้อความให้คุณ`;
            default:
                return notification.message;
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'เมื่อสักครู่';
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        if (days < 7) return `${days} วันที่แล้ว`;
        
        return new Date(date).toLocaleDateString('th-TH');
    };

    return (
        <div className="notification-center">
            <div className="notification-bell">
                <button 
                    className="bell-button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    title="เตือน"
                >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </button>

                {showDropdown && (
                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <h3>เตือน</h3>
                            {unreadCount > 0 && (
                                <button 
                                    className="mark-all-read-btn"
                                    onClick={handleMarkAllAsRead}
                                >
                                    ทำเครื่องหมายว่าอ่านแล้ว
                                </button>
                            )}
                            <button 
                                className="close-dropdown-btn"
                                onClick={() => setShowDropdown(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="empty-notifications">
                                    <Bell size={32} />
                                    <p>ไม่มีเตือนใหม่</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div 
                                        key={notification.id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-icon">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-avatar">
                                                <img 
                                                    src={notification.senderAvatar || 'https://via.placeholder.com/32?text=User'} 
                                                    alt={notification.senderName}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/32?text=User';
                                                    }}
                                                />
                                            </div>
                                            <div className="notification-message">
                                                <p>{getNotificationMessage(notification)}</p>
                                                <span className="notification-time">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div className="unread-indicator"></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
