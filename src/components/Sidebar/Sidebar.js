import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button/Button';
import styles from './Sidebar.module.css';

const navigation = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )
  },
  {
    name: 'Todo List',
    path: '/todos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
      </svg>
    )
  },
  {
    name: 'Schedule',
    path: '/schedule',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    )
  },
  {
    name: 'Reminders',
    path: '/reminders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 01-3.46 0"></path>
      </svg>
    )
  },
  {
    name: 'Notes',
    path: '/notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
      </svg>
    )
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  }
];

const Sidebar = ({ isOpen, onClose, currentPath }) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className={styles.sidebar}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            role="navigation"
            aria-label="Main navigation"
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Menu</h2>
              <Button
                variant="ghost"
                size="small"
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>

            <nav className={styles.nav}>
              <ul className={styles.navList}>
                {navigation.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `${styles.navLink} ${isActive ? styles.active : ''}`
                      }
                      aria-current={currentPath === item.path ? 'page' : undefined}
                    >
                      <span className={styles.navIcon}>
                        {item.icon}
                      </span>
                      <span className={styles.navText}>
                        {item.name}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.footer}>
              <p className={styles.footerText}>Schedule App v1.0</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - always visible on larger screens */}
      <aside className={styles.desktopSidebar} role="navigation" aria-label="Main navigation">
        <div className={styles.header}>
          <h2 className={styles.title}>Menu</h2>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navigation.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  aria-current={currentPath === item.path ? 'page' : undefined}
                >
                  <span className={styles.navIcon}>
                    {item.icon}
                  </span>
                  <span className={styles.navText}>
                    {item.name}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.footer}>
          <p className={styles.footerText}>Schedule App v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
