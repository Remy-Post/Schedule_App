import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updatePassword, updateProfile, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import styles from './Profile.module.css';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { todos, events, reminders, notes } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || ''
    }));
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(currentUser, {
        displayName: formData.displayName.trim()
      });
      
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword) {
      setError('New password is required');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(currentUser, formData.newPassword);
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setSuccess('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before changing your password.');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const userData = {
        profile: {
          displayName: currentUser?.displayName,
          email: currentUser?.email,
          exportedAt: new Date().toISOString()
        },
        todos: todos.map(todo => ({
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          dueDate: todo.dueDate?.toDate?.()?.toISOString() || null,
          completed: todo.completed,
          createdAt: todo.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: todo.updatedAt?.toDate?.()?.toISOString() || null
        })),
        events: events.map(event => ({
          title: event.title,
          description: event.description,
          startDate: event.startDate?.toDate?.()?.toISOString() || null,
          endDate: event.endDate?.toDate?.()?.toISOString() || null,
          allDay: event.allDay,
          createdAt: event.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: event.updatedAt?.toDate?.()?.toISOString() || null
        })),
        reminders: reminders.map(reminder => ({
          title: reminder.title,
          description: reminder.description,
          reminderTime: reminder.reminderTime?.toDate?.()?.toISOString() || null,
          completed: reminder.completed,
          createdAt: reminder.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: reminder.updatedAt?.toDate?.()?.toISOString() || null
        })),
        notes: notes.map(note => ({
          title: note.title,
          content: note.content,
          tags: note.tags,
          createdAt: note.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: note.updatedAt?.toDate?.()?.toISOString() || null
        }))
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'This action cannot be undone. All your data will be permanently deleted.\n\nType "DELETE" to confirm:'
    );
    
    if (confirmation !== 'DELETE') {
      return;
    }

    setLoading(true);
    try {
      await deleteUser(currentUser);
      // User will be automatically logged out
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before deleting your account.');
      } else {
        setError('Failed to delete account. Please try again.');
      }
      setLoading(false);
    }
  };

  const getStatsData = () => {
    const completedTodos = todos.filter(todo => todo.completed).length;
    const upcomingEvents = events.filter(event => {
      const eventDate = event.startDate?.toDate?.() || new Date(event.startDate);
      return eventDate >= new Date();
    }).length;
    const completedReminders = reminders.filter(reminder => reminder.completed).length;

    return {
      todos: { total: todos.length, completed: completedTodos },
      events: { total: events.length, upcoming: upcomingEvents },
      reminders: { total: reminders.length, completed: completedReminders },
      notes: { total: notes.length }
    };
  };

  const stats = getStatsData();

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      className={styles.profile}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Profile & Settings</h1>
          <p className={styles.subtitle}>
            Manage your account, preferences, and data
          </p>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <h3 className={styles.userName}>
              {currentUser?.displayName || 'User'}
            </h3>
            <p className={styles.userEmail}>{currentUser?.email}</p>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'data' ? styles.active : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data & Privacy
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success} role="alert">
          {success}
        </div>
      )}

      <div className={styles.content}>
        {activeTab === 'profile' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.2 }}
          >
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              <form onSubmit={handleUpdateProfile} className={styles.form}>
                <Input
                  type="text"
                  name="displayName"
                  label="Display Name"
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <Input
                  type="email"
                  name="email"
                  label="Email Address"
                  value={formData.email}
                  disabled={true}
                  helperText="Email cannot be changed"
                />
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <LoadingSpinner size="small" text="" /> : 'Update Profile'}
                </Button>
              </form>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Change Password</h3>
              <form onSubmit={handleUpdatePassword} className={styles.form}>
                <Input
                  type="password"
                  name="newPassword"
                  label="New Password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="Must be at least 6 characters long"
                />
                <Input
                  type="password"
                  name="confirmPassword"
                  label="Confirm New Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <LoadingSpinner size="small" text="" /> : 'Update Password'}
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.2 }}
          >
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Appearance</h3>
              <div className={styles.preference}>
                <div className={styles.preferenceInfo}>
                  <h4 className={styles.preferenceTitle}>Theme</h4>
                  <p className={styles.preferenceDescription}>
                    Choose between light and dark mode
                  </p>
                </div>
                <div className={styles.themeToggle}>
                  <Button
                    variant={theme === 'light' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => theme === 'dark' && toggleTheme()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => theme === 'light' && toggleTheme()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Dark
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.2 }}
          >
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Data Export</h3>
              <p className={styles.sectionDescription}>
                Export all your data including todos, events, reminders, and notes in JSON format.
              </p>
              <Button variant="outline" onClick={handleExportData} disabled={loading}>
                {loading ? <LoadingSpinner size="small" text="" /> : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export Data
                  </>
                )}
              </Button>
            </div>

            <div className={styles.dangerSection}>
              <h3 className={styles.sectionTitle}>Danger Zone</h3>
              <div className={styles.dangerItem}>
                <div className={styles.dangerInfo}>
                  <h4 className={styles.dangerTitle}>Delete Account</h4>
                  <p className={styles.dangerDescription}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button variant="danger" onClick={handleDeleteAccount} disabled={loading}>
                  {loading ? <LoadingSpinner size="small" text="" /> : 'Delete Account'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.2 }}
          >
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9,11 12,14 22,4"></polyline>
                    <path d="m21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h4 className={styles.statTitle}>Todos</h4>
                  <p className={styles.statNumber}>{stats.todos.total}</p>
                  <p className={styles.statDetail}>{stats.todos.completed} completed</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h4 className={styles.statTitle}>Events</h4>
                  <p className={styles.statNumber}>{stats.events.total}</p>
                  <p className={styles.statDetail}>{stats.events.upcoming} upcoming</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h4 className={styles.statTitle}>Reminders</h4>
                  <p className={styles.statNumber}>{stats.reminders.total}</p>
                  <p className={styles.statDetail}>{stats.reminders.completed} completed</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <h4 className={styles.statTitle}>Notes</h4>
                  <p className={styles.statNumber}>{stats.notes.total}</p>
                  <p className={styles.statDetail}>Rich text notes</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile;
