import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

// Send a friend request
export async function sendFriendRequest(currentUid, targetUid) {
  if (!currentUid || !targetUid || currentUid === targetUid) return;

  const currentRef = doc(db, "users", currentUid);
  const targetRef = doc(db, "users", targetUid);

  const targetSnap = await getDoc(targetRef);
  const targetData = targetSnap.data() || {};

  //  Don't send if the target already sent a request to you
  if (targetData.requestsSent?.includes(currentUid)) {
    console.log("Skipping: target already sent a request — should accept instead.");
    return;
  }

  // Don't send if you're already friends
  if (targetData.friends?.includes(currentUid)) {
    console.log("Skipping: users are already friends.");
    return;
  }

  // Create a new friend request
  await updateDoc(currentRef, { requestsSent: arrayUnion(targetUid) });
  await updateDoc(targetRef, { requestsReceived: arrayUnion(currentUid) });

  console.log(`Friend request sent from ${currentUid} → ${targetUid}`);
}

// Accept a friend request
export async function acceptFriendRequest(currentUid, targetUid) {
  const currentRef = doc(db, "users", currentUid);
  const targetRef = doc(db, "users", targetUid);

  await updateDoc(currentRef, {
    friends: arrayUnion(targetUid),
    requestsReceived: arrayRemove(targetUid)
  });
  await updateDoc(targetRef, {
    friends: arrayUnion(currentUid),
    requestsSent: arrayRemove(currentUid)
  });

  console.log(`Friend request accepted: ${currentUid} ↔ ${targetUid}`);
}

// Remove or cancel friendship/request
export async function removeFriend(currentUid, targetUid) {
  const currentRef = doc(db, "users", currentUid);
  const targetRef = doc(db, "users", targetUid);

  await updateDoc(currentRef, {
    friends: arrayRemove(targetUid),
    requestsSent: arrayRemove(targetUid),
    requestsReceived: arrayRemove(targetUid)
  });
  await updateDoc(targetRef, {
    friends: arrayRemove(currentUid),
    requestsSent: arrayRemove(currentUid),
    requestsReceived: arrayRemove(currentUid)
  });

  console.log(`Removed friendship or request between ${currentUid} and ${targetUid}`);
}

// Check relationship status
export async function getFriendStatus(currentUid, targetUid) {
  if (!currentUid || !targetUid) return "none";

  const currentSnap = await getDoc(doc(db, "users", currentUid));
  const currentData = currentSnap.data() || {};

  const targetSnap = await getDoc(doc(db, "users", targetUid));
  const targetData = targetSnap.data() || {};

  console.log("getFriendStatus()");
  console.log("  currentUid:", currentUid);
  console.log("  targetUid:", targetUid);
  console.log("  currentData:", {
    friends: currentData.friends,
    requestsSent: currentData.requestsSent,
    requestsReceived: currentData.requestsReceived
  });
  console.log("  targetData:", {
    friends: targetData.friends,
    requestsSent: targetData.requestsSent,
    requestsReceived: targetData.requestsReceived
  });

  // Already friends
  if (currentData.friends?.includes(targetUid)) return "friends";

  // You sent them a request
  if (currentData.requestsSent?.includes(targetUid)) return "sent";

  // They sent you a request
  if (currentData.requestsReceived?.includes(targetUid)) return "received";

  // Safety double-check
  if (targetData.requestsSent?.includes(currentUid)) return "received";

  return "none";
}
