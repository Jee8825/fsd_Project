import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatRelativeTime } from '../../utils/helpers';

const isNotificationVisible = (notification, user) => {
  if (notification.forUserId) return user?.id === notification.forUserId;
  if (!notification.forRole) return true;
  if (notification.forRole === 'admin') return user?.role === 'admin';
  if (notification.forRole === 'editor') return user?.role === 'admin' || user?.role === 'editor';
  if (notification.forRole === 'user') {
    return !user || user.role === 'viewer' || user.role === 'user';
  }
  return true;
};

const NotificationCenter = () => {
  const {
    notifications,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const visible = useMemo(
    () => notifications.filter((notification) => isNotificationVisible(notification, currentUser)),
    [notifications, currentUser],
  );
  const unread = visible.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="notification-center" ref={containerRef}>
      <button
        type="button"
        className="icon-button notification-center__bell"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <span aria-hidden="true">◉</span>
        {unread > 0 && <span className="notification-center__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="notification-center__panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="notification-center__head">
              <strong>Notifications</strong>
              <div className="button-row">
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={markAllNotificationsRead}
                  disabled={!unread}
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={clearNotifications}
                  disabled={!visible.length}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="notification-center__list">
              {visible.length === 0 ? (
                <div className="notification-center__empty">
                  <p>No notifications yet.</p>
                  <small>You'll see review activity, role changes, and content updates here.</small>
                </div>
              ) : (
                visible.map((notification) => {
                  const Wrapper = notification.link ? Link : 'div';
                  const wrapperProps = notification.link
                    ? { to: notification.link, onClick: () => { markNotificationRead(notification.id); setOpen(false); } }
                    : { onClick: () => markNotificationRead(notification.id) };
                  return (
                    <Wrapper
                      key={notification.id}
                      className={`notification-item notification-item--${notification.tone || 'default'} ${
                        notification.read ? 'is-read' : ''
                      }`}
                      {...wrapperProps}
                    >
                      <div className="notification-item__body">
                        <strong>{notification.title}</strong>
                        {notification.body && <p>{notification.body}</p>}
                        <small>{formatRelativeTime(notification.createdAt)}</small>
                      </div>
                      {!notification.read && <span className="notification-item__dot" aria-hidden="true" />}
                    </Wrapper>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
