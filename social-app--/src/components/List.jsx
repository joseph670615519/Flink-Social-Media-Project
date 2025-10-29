import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import avatarImg from "../assets/FlinkAva.png";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const List = () => {
  const [friends, setFriends] = useState([]);

  // 🔄 Load actual friend list from Firestore in real time
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

      // Fetch each friend's profile
      const friendDocs = await Promise.all(
        friendIds.map(async (fid) => {
          const fSnap = await getDoc(doc(db, "users", fid));
          if (fSnap.exists()) {
            const fData = fSnap.data();
            return {
              id: fid,
              name: fData.displayName || "Unknown",
              avatar: fData.photoURL || avatarImg,
            };
          }
          return null;
        })
      );

      setFriends(friendDocs.filter(Boolean));
    });

    return () => unsub();
  }, []);

  return (
    <div className="list-container">
      <h2 style={{ marginBottom: "1rem" }}>Friends</h2>

      {friends.length === 0 ? (
        <p style={{ color: "#666" }}>No friends yet.</p>
      ) : (
        <ul className="friends-list">
          {friends.map((friend) => (
            <li key={friend.id} className="friend-item">
              <Link
                to={`/profile/${friend.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  textDecoration: "none",
                  color: "inherit",
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  transition: "background 0.2s",
                }}
              >
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="friend-avatar"
                />
                <span className="friend-name">{friend.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default List;
