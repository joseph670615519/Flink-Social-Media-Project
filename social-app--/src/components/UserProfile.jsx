import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TweetContext } from "./TweetContext";
import avatarImg from "../assets/FlinkAva.png";
import { auth, ensureUserDoc, db } from "../firebase";
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriendStatus,
} from "./Friends";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function UserProfile() {
  const { userId } = useParams();
  const [tweets = []] = useContext(TweetContext) || [];
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState("none");
  const [friends, setFriends] = useState([]);

  async function resolveTargetUid(idFromUrl) {
    if (!idFromUrl) return null;

    // If it looks like a UID (long random string)
    if (idFromUrl.length > 20) {
      const snap = await getDoc(doc(db, "users", idFromUrl));
      if (snap.exists()) return idFromUrl;
    }

    const usersRef = collection(db, "users");

    // Try lowercase match first
    const qLower = query(
      usersRef,
      where("displayNameLower", "==", idFromUrl.toLowerCase())
    );
    const snapLower = await getDocs(qLower);
    if (!snapLower.empty) return snapLower.docs[0].id;

    // Then try exact displayName match
    const qExact = query(usersRef, where("displayName", "==", idFromUrl));
    const snapExact = await getDocs(qExact);
    if (!snapExact.empty) return snapExact.docs[0].id;

    console.warn("Could not resolve UID for:", idFromUrl);
    return null;
  }

  // Load and live-update friendship status (wait for Auth to be ready)
  useEffect(() => {
    console.log("UserProfile effect running for userId:", userId);

    let unsubAuth;
    let unsubCurrent;
    let unsubTarget;

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("Auth not ready or user logged out, skipping setupRealtime");
        setStatus("none");
        return;
      }

      const current = user.uid;
      console.log("Auth ready for current user:", current);

      const targetUid = await resolveTargetUid(userId);
      console.log("Resolved targetUid:", targetUid);

      if (!targetUid) {
        console.warn("No targetUid, setting status none");
        setStatus("none");
        return;
      }

      try {
        const statusNow = await getFriendStatus(current, targetUid);
        console.log("Initial getFriendStatus:", statusNow);
        setStatus(statusNow);
      } catch (e) {
        console.error("getFriendStatus failed:", e);
        setStatus("none");
      }

      const currentRef = doc(db, "users", current);
      const targetRef = doc(db, "users", targetUid);

      unsubCurrent = onSnapshot(currentRef, async () => {
        try {
          const newStatus = await getFriendStatus(current, targetUid);
          console.log("New status (current):", newStatus);
          setStatus(newStatus);
        } catch (e) {
          console.error("onSnapshot current getFriendStatus failed:", e);
        }
      });

      unsubTarget = onSnapshot(targetRef, async () => {
        try {
          const newStatus = await getFriendStatus(current, targetUid);
          console.log("New status (target):", newStatus);
          setStatus(newStatus);
        } catch (e) {
          console.error("onSnapshot target getFriendStatus failed:", e);
        }
      });
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubCurrent) unsubCurrent();
      if (unsubTarget) unsubTarget();
    };
  }, [userId]);


// 🧑‍🤝‍🧑 Load actual friends list from Firestore
useEffect(() => {
  if (!auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const userRef = doc(db, "users", uid);

  const unsub = onSnapshot(userRef, async (snap) => {
    const data = snap.data();
    const friendIds = data?.friends || [];

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    // Fetch each friend's displayName
    const friendDocs = await Promise.all(
      friendIds.map(async (fid) => {
        const fSnap = await getDoc(doc(db, "users", fid));
        if (fSnap.exists()) {
          return { id: fid, ...fSnap.data() };
        }
        return null;
      })
    );

    setFriends(friendDocs.filter(Boolean)); // remove nulls
  });

  return () => unsub();
}, []);

  
  
  // Handle friend actions
  const handleFriendAction = async () => {
    console.log(
      "handleFriendAction()",
      "current:",
      auth.currentUser?.uid,
      "target param:",
      userId,
      "status:",
      status
    );

    const current = auth.currentUser?.uid;
    if (!current) {
      alert("You must be logged in to use friend features.");
      return;
    }

    const targetUid = await resolveTargetUid(userId);
    console.log("Resolved targetUid for handleFriendAction:", targetUid);

    if (!targetUid) {
      alert("Could not find that user’s account.");
      return;
    }

    if (status === "none") {
      await sendFriendRequest(current, targetUid);
      setStatus("sent");
    } else if (status === "received") {
      await acceptFriendRequest(current, targetUid);
      setStatus("friends");
    } else if (status === "friends") {
      await removeFriend(current, targetUid);
      setStatus("none");
    }
  };

  // Demo / fallback data
  useEffect(() => {
    const storedUsers = [
      {
        id: "user1",
        displayName: "Alice Johnson",
        email: "alice@example.com",
        photoURL: avatarImg,
        bio: "Love sharing my thoughts and connecting with friends!",
        friendsCount: 156,
        postsCount: 42,
        likesCount: 523,
      },
      {
        id: "user2",
        displayName: "Bob Smith",
        email: "bob@example.com",
        photoURL: avatarImg,
        bio: "Tech enthusiast | Coffee lover | Always learning",
        friendsCount: 89,
        postsCount: 28,
        likesCount: 312,
      },
      {
        id: "user3",
        displayName: "Carol Williams",
        email: "carol@example.com",
        photoURL: avatarImg,
        bio: "Artist & Designer | Creating beautiful things every day",
        friendsCount: 234,
        postsCount: 67,
        likesCount: 891,
      },
    ];

    const user = storedUsers.find((u) => u.id === userId);

    if (user) {
      setUserData(user);
    } else {
      setUserData({
        id: userId,
        displayName: `User ${userId}`,
        email: `${userId}@example.com`,
        photoURL: avatarImg,
        bio: "This user hasn't set up their bio yet.",
        friendsCount: Math.floor(Math.random() * 100),
        postsCount: 0,
        likesCount: 0,
      });
    }
  }, [userId]);

  if (!userData) {
    return <div className="main-content">Loading profile...</div>;
  }

  const userTweets = tweets.filter((t) => t.userId === userId);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover" />
        <div className="profile-meta">
          <img
            src={userData.photoURL || avatarImg}
            alt={userData.displayName}
            className="profile-avatar-large"
          />
          <div className="profile-info">
            <h1>{userData.displayName}</h1>
            {userData.email && (
              <p className="profile-email">{userData.email}</p>
            )}
            <p className="profile-bio">
              {userData.bio || "No bio available."}
            </p>
          </div>
          <div className="profile-actions">
            <button className="small-btn" onClick={handleFriendAction}>
              {status === "friends"
                ? "Unfriend"
                : status === "sent"
                ? "Request Sent"
                : status === "received"
                ? "Accept Request"
                : "Add Friend"}
            </button>
            <button
              className="small-btn"
              style={{ marginLeft: "0.5rem" }}
            >
              Message
            </button>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat">
            <strong>{userTweets.length}</strong>
            <span>Posts</span>
          </div>
          <div className="stat">
            <strong>{userData.friendsCount || 0}</strong>
            <span>Friends</span>
          </div>
          <div className="stat">
            <strong>{userData.likesCount || 0}</strong>
            <span>Likes</span>
          </div>
        </div>
      </div>

      <section className="profile-posts">
        <h2>{userData.displayName}'s posts</h2>
        {userTweets.length === 0 && (
          <p style={{ color: "#666" }}>
            {userData.displayName} hasn't posted anything yet.
          </p>
        )}
        {userTweets.map((t) => (
          <div key={t.id} className="profile-post-card">
            <div className="post-header">
              <img
                src={userData.photoURL || avatarImg}
                alt={userData.displayName}
                className="post-avatar"
              />
              <div>
                <strong>{userData.displayName}</strong>
                <div
                  className="post-meta"
                  style={{ fontSize: "0.85rem", color: "#666" }}
                >
                  {t.date || "Just now"}
                </div>
              </div>
            </div>
            <h3 style={{ margin: "8px 0" }}>{t.title}</h3>
            <p>{t.message}</p>
            <div
              style={{
                marginTop: "0.75rem",
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              ❤️ {t.likes || 0} likes
            </div>
          </div>
        ))}
      </section>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link to="/" style={{ color: "#86c76b", textDecoration: "none" }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
