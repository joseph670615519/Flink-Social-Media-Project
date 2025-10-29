import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TweetContext } from "./TweetContext";
import avatarImg from "../assets/FlinkAva.png";
import { auth, db } from "../firebase";
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
  const [tweets] = useContext(TweetContext) || [[]];
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState("none");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolve UID whether it's name or ID
  async function resolveTargetUid(idFromUrl) {
    if (!idFromUrl) return null;

    if (idFromUrl.length > 20) {
      const snap = await getDoc(doc(db, "users", idFromUrl));
      if (snap.exists()) return idFromUrl;
    }

    const usersRef = collection(db, "users");

    const qLower = query(
      usersRef,
      where("displayNameLower", "==", idFromUrl.toLowerCase())
    );
    const snapLower = await getDocs(qLower);
    if (!snapLower.empty) return snapLower.docs[0].id;

    const qExact = query(usersRef, where("displayName", "==", idFromUrl));
    const snapExact = await getDocs(qExact);
    if (!snapExact.empty) return snapExact.docs[0].id;

    console.warn("Could not resolve UID for:", idFromUrl);
    return null;
  }

  // 🧠 Load friendship status live
  useEffect(() => {
    let unsubAuth, unsubCurrent, unsubTarget;

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("none");
        return;
      }

      const current = user.uid;
      const targetUid = await resolveTargetUid(userId);
      if (!targetUid) {
        setStatus("none");
        return;
      }

      try {
        const statusNow = await getFriendStatus(current, targetUid);
        setStatus(statusNow);
      } catch {
        setStatus("none");
      }

      const currentRef = doc(db, "users", current);
      const targetRef = doc(db, "users", targetUid);

      unsubCurrent = onSnapshot(currentRef, async () => {
        const newStatus = await getFriendStatus(current, targetUid);
        setStatus(newStatus);
      });

      unsubTarget = onSnapshot(targetRef, async () => {
        const newStatus = await getFriendStatus(current, targetUid);
        setStatus(newStatus);
      });
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubCurrent) unsubCurrent();
      if (unsubTarget) unsubTarget();
    };
  }, [userId]);

  // 🧑‍🤝‍🧑 Friend list live update
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

      const friendDocs = await Promise.all(
        friendIds.map(async (fid) => {
          const fSnap = await getDoc(doc(db, "users", fid));
          if (fSnap.exists()) return { id: fid, ...fSnap.data() };
          return null;
        })
      );
      setFriends(friendDocs.filter(Boolean));
    });

    return () => unsub();
  }, []);

  // 🧾 Load viewed user's data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserData({ id: userId, ...userDoc.data() });
        } else {
          setUserData({
            id: userId,
            displayName: "User Not Found",
            bio: "This user could not be found.",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData({
          id: userId,
          displayName: "Error Loading User",
          bio: "There was an error loading this profile.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserData();
  }, [userId]);

  const handleFriendAction = async () => {
    const current = auth.currentUser?.uid;
    if (!current) {
      alert("You must be logged in to use friend features.");
      return;
    }

    const targetUid = await resolveTargetUid(userId);
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

  if (loading) return <div className="main-content">Loading profile...</div>;
  if (!userData) return <div className="main-content">User not found.</div>;

  const userTweets = tweets.filter((t) => t.userId === userId);
  const friendsCount = friends.length;

  return (
    <div className="profile-page">
      {/* Cover header */}
      <div
        className="cover-photo-container"
        style={{
          background: "linear-gradient(135deg, #86c76b, #6bbf4e)",
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "1.2rem",
        }}
      >
        <span>{userData.displayName}'s Profile</span>
      </div>

      {/* Profile info */}
      <div className="profile-info-section">
        <img
          src={userData.photoURL || avatarImg}
          alt={userData.displayName}
          className="profile-picture"
        />
        <div className="profile-details">
          <h1>{userData.displayName}</h1>
          {userData.email && (
            <p className="profile-email">{userData.email}</p>
          )}
          <p className="profile-bio">
            {userData.bio || "This user hasn't written a bio yet."}
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
          <button className="small-btn" style={{ marginLeft: "0.5rem" }}>
            Message
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat">
          <strong>{userTweets.length}</strong>
          <span>Posts</span>
        </div>
        <div className="stat">
          <strong>{friendsCount}</strong>
          <span>Friends</span>
        </div>
        <div className="stat">
          <strong>0</strong>
          <span>Photos</span>
        </div>
      </div>

      {/* Posts */}
      <section className="profile-posts" style={{ padding: "1rem" }}>
        <h2>{userData.displayName}'s Posts</h2>
        {userTweets.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>{userData.displayName} hasn’t posted anything yet.</p>
          </div>
        ) : (
          userTweets.map((t) => (
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
          ))
        )}
      </section>

      {/* Back link */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link to="/feed" style={{ color: "#86c76b", textDecoration: "none" }}>
          ← Back to Feed
        </Link>
      </div>
    </div>
  );
}
