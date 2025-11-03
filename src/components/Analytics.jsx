import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  Timestamp,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db, auth, ADMIN_EMAILS } from '../firebase';
import './Analytics.css';

function Analytics() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    todayPosts: 0,
    weeklyPosts: 0,
    monthlyPosts: 0,
    activeUsers: 0,
    topCountries: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkAdminRole(currentUser);
      } else {
        setAdminLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [timeRange, isAdmin]);

  const checkAdminRole = async (currentUser) => {
    if (!currentUser) {
      setAdminLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      // Check if user is admin (by role in Firestore or by email)
      const isUserAdmin = 
        userData?.role === 'admin' || 
        userData?.isAdmin === true || 
        ADMIN_EMAILS.includes(currentUser.email);
      
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get current date ranges
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Fetch all tweets/posts
      const tweetsRef = collection(db, 'tweets');
      const allTweets = await getDocs(tweetsRef);
      const totalPosts = allTweets.size;

      // Count posts by time period
      let todayCount = 0;
      let weeklyCount = 0;
      let monthlyCount = 0;

      allTweets.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const postDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          
          if (postDate >= todayStart) {
            todayCount++;
          }
          if (postDate >= weekAgo) {
            weeklyCount++;
          }
          if (postDate >= monthAgo) {
            monthlyCount++;
          }
        }
      });

      // Fetch all users
      const usersRef = collection(db, 'users');
      const allUsers = await getDocs(usersRef);
      const totalUsers = allUsers.size;

      // Simulate active users (in real app, you'd track this)
      const activeUsers = Math.floor(totalUsers * 0.6); // 60% active rate

      // Simulate top countries data
      const topCountries = [
        { country: 'Thailand', users: Math.floor(totalUsers * 0.4) },
        { country: 'Singapore', users: Math.floor(totalUsers * 0.2) },
        { country: 'Vietnam', users: Math.floor(totalUsers * 0.15) },
        { country: 'Malaysia', users: Math.floor(totalUsers * 0.1) },
        { country: 'Philippines', users: Math.floor(totalUsers * 0.08) }
      ];

      setStats({
        totalPosts,
        totalUsers,
        todayPosts: todayCount,
        weeklyPosts: weeklyCount,
        monthlyPosts: monthlyCount,
        activeUsers,
        topCountries
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon" style={{ background: color }}>
          {icon}
        </div>
        <h3>{title}</h3>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );

  const Chart = ({ data, label }) => (
    <div className="chart-container">
      <h4>{label}</h4>
      <div className="simple-bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar">
              <div 
                className="bar-fill" 
                style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
              />
            </div>
            <div className="bar-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Show loading while checking admin status
  if (adminLoading) {
    return (
      <div className="analytics-loading">
        <h2>Analytics Dashboard</h2>
        <p>Checking permissions...</p>
      </div>
    );
  }

  // Show access denied if not logged in
  if (!user) {
    return (
      <div className="analytics-access-denied">
        <h2>🔒 Access Denied</h2>
        <p>You need to be logged in to access analytics.</p>
        <div className="back-to-home">
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="analytics-access-denied">
        <h2>🔒 Admin Access Required</h2>
        <p>Sorry, you don't have permission to view analytics dashboard.</p>
        <p>This page is restricted to administrators only.</p>
        <div className="back-to-home">
          <a href="/feed">← Back to Home</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <h2>Analytics Dashboard</h2>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  const chartData = [
    { label: 'Today', value: stats.todayPosts },
    { label: '7 Days', value: stats.weeklyPosts },
    { label: '30 Days', value: stats.monthlyPosts }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Flink Analytics</h1>
        <div className="time-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="User Activity Over Time"
          value={stats.weeklyPosts}
          subtitle="7 DAYS"
          icon=""
          color="#4CAF50"
        />
        
        <StatCard
          title="Active Users in Last 30 Minutes"
          value={stats.activeUsers}
          subtitle="ACTIVE USERS PER MINUTE"
          icon=""
          color="#2196F3"
        />
        
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          subtitle="All time posts"
          icon=""
          color="#FF9800"
        />
        
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered users"
          icon=""
          color="#9C27B0"
        />
      </div>

      <div className="charts-row">
        <div className="chart-section">
          <Chart data={chartData} label="Posts Activity" />
        </div>
        
        <div className="countries-section">
          <h4>Top Countries</h4>
          <div className="countries-list">
            {stats.topCountries.length > 0 ? (
              stats.topCountries.map((country, index) => (
                <div key={index} className="country-item">
                  <span className="country-name">{country.country}</span>
                  <span className="country-users">{country.users} users</span>
                </div>
              ))
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="realtime-section">
        <div className="realtime-header">
          <h4>Realtime Activity</h4>
          <button 
            onClick={fetchAnalytics}
            className="refresh-btn"
          >
            Refresh
          </button>
        </div>
        <div className="realtime-stats">
          <div className="realtime-item">
            <span>Posts Today:</span>
            <strong>{stats.todayPosts}</strong>
          </div>
          <div className="realtime-item">
            <span>Active Now:</span>
            <strong>{Math.floor(Math.random() * 5) + 1}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;