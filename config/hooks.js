import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import moment from "moment";
import { auth, db, storage } from "./firebase";

export const uploadProfile = async (file, uid) => {
  try {
    if (!file) return;

    const storageRef = ref(storage, uid);

    const imageRef = ref(storageRef, `profiles/${uid}`);

    uploadBytes(imageRef, file).then((snapshot) => {
      console.log("Uploaded a blob or file!");
      console.log(snapshot);
    });
  } catch (e) {
    console.log(e);
  }
};

export const createUser = async (formdata) => {
  try {
    // signup firebase auth
    const userRes = await createUserWithEmailAndPassword(
      auth,
      formdata.email,
      formdata.password
    );

    // get the uid
    const uid = userRes.user.uid;

    const data = {
      uid,
      displayName: formdata.username,
      email: formdata.email,
      status: "online",
      photoURL: "",
      createdAt: Timestamp.now(),
    };

    await createAccount(data);
  } catch (e) {
    console.log(e);

    return {
      error: e,
    };
  }
};

const checkIfEmailExists = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

const createAccount = async (data) => {
  try {
    const userRef = doc(db, "users", data.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await toggleUserStatus(data.uid, "online");

      return; // Exit early if user already exists
    }

    await setDoc(userRef, data);
    console.log("User created: ", data);
  } catch (e) {
    console.log(e);

    return {
      error: e,
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userRes = await signInWithEmailAndPassword(auth, email, password);
    const user = userRes.user;
    const uid = user.uid;
    const userRef = collection(db, "users", uid);
    await getDoc(userRef, (snapshot) => {
      if (snapshot) {
        console.log("snapshots: ", snapshot);
        return {
          data: snapshot.data(),
        };
      }
    });

    // change the status of the user to online
    await toggleUserStatus(uid, "online");
    console.log("User logged in: ", user);

    return {
      data: user,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
};

export const toggleUserStatus = async (uid, status) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { status: status, updatedAt: serverTimestamp() });
  } catch (e) {
    console.log(e);
  }
};

export const fetchUserById = async (uid, callback) => {
  try {
    const userRef = doc(db, "users", uid);

    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        console.log("No such user!");
        callback(null);
      }
    });

    return unsubscribe; // caller can use this to stop listening
  } catch (e) {
    console.error("Error listening to user:", e);
    return () => {}; // return noop if there's an error
  }
};

export const fetchUserByUsername = async (username) => {
  try {
    const userRef = collection(db, "users");
    const q = query(userRef, where("displayName", "==", username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("No matching documents.");
      return;
    }
    snapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.log(e);
  }
};

export const fetchAllUsers = async (callback) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "!=", "")); // Exclude users with empty email

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(users);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const GoogleAuth = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userRes = await signInWithPopup(auth, provider);
    const user = userRes.user;
    const uid = user.uid;
    const userExist = await checkIfEmailExists(user?.email);

    if (!userExist) {
      await createAccount({
        uid,
        displayName: user.displayName,
        email: user.email,
        status: "online",
        photoURL: user.photoURL,
        createdAt: Timestamp.now(),
      });
    }

    // change the status of the user to online
    await toggleUserStatus(uid, "online");
    console.log("User logged in: ", user);

    return {
      data: user,
    };
  } catch (e) {
    console.log(e);
    return {
      error: e,
    };
  }
};

export const FacebookAuth = async () => {
  try {
    const provider = new FacebookAuthProvider();

    // Scopes
    provider.addScope("email");
    provider.addScope("public_profile"); // default

    const userRes = await signInWithPopup(auth, provider);
    const user = userRes.user;
    const uid = user.uid;
    const userExist = await checkIfEmailExists(user?.email);

    if (!userExist) {
      await createAccount({
        uid,
        displayName: user.displayName,
        email: user.email,
        status: "online",
        photoURL: user.photoURL,
        createdAt: Timestamp.now(),
      });
    }

    // change the status of the user to online
    await toggleUserStatus(uid, "online");
    console.log("User logged in: ", user);

    return {
      data: user,
    };
  } catch (e) {
    console.log(e);
    return {
      error: e,
    };
  }
};

export const GitHubAuth = async () => {
  try {
    const provider = new GithubAuthProvider();
    const userRes = await signInWithPopup(auth, provider);
    const user = userRes.user;
    const uid = user.uid;
    const userExist = await checkIfEmailExists(user?.email);

    if (!userExist) {
      await createAccount({
        uid,
        displayName: user.displayName,
        email: user.email,
        status: "online",
        photoURL: user.photoURL,
        createdAt: Timestamp.now(),
      });
    }

    // change the status of the user to online
    await toggleUserStatus(uid, "online");
    console.log("User logged in: ", user);

    return {
      data: user,
    };
  } catch (e) {
    console.log(e);
  }
};

export const logoutUser = async () => {
  try {
    // change the status of the user to offline
    const uid = auth.currentUser?.uid;
    await toggleUserStatus(uid, "offline");
    await signOut(auth);
    localStorage.removeItem("user");

    console.log("User logged out");
  } catch (e) {
    console.log(e);
  }
};

export const AnonymousSignin = async () => {
  try {
    const res = await signInAnonymously(auth);
    const uid = res.user.uid;
    console.log(res);

    await createAccount({
      uid,
      displayName: "Anonymous",
      email: "",
      status: "online",
      photoURL:
        "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F013%2F317%2F294%2Foriginal%2Fincognito-icon-man-woman-face-with-glasses-black-and-white-graphic-spy-agent-line-and-glyph-icon-security-and-detective-hacker-sign-graphics-editable-stroke-linear-icon-free-vector.jpg&f=1&nofb=1&ipt=b94b7dea24b7bc4f9dcbca158723d626ae9bac7220954149c2bb42d805ed81f5",
      createdAt: Timestamp.now(),
    });
  } catch (e) {
    console.log(e);
  }
};

export const createGlobalChat = async (uid, senderName, photoUrl, msg) => {
  try {
    const chatRef = collection(db, "globalChats");
    const data = {
      id: uid,
      senderId: uid,
      senderName: senderName,
      senderPhoto: photoUrl,
      message: msg,
      createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      timestamp: serverTimestamp(),
    };

    await addDoc(chatRef, data);
  } catch (e) {
    console.log(e);
  }
};

export const DeleteChat = async (convoId, status = "inactive") => {
  try {
    const messagesRef = collection(db, `chats/${convoId}/messages`);
    const snapshot = await getDocs(messagesRef);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );

    await Promise.all(deletePromises);

    // update the convo to inactive
    await updateDoc(doc(db, "chats", convoId), { status });

    console.log(`Chat ${convoId} messages deleted.`);
  } catch (e) {
    console.log(e);
  }
};

export const AddPost = (uid, postData) => {
  try {
    const postsRef = collection(db, `posts/${uid}/userPosts`);
    const data = {
      ...postData,
      uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    return addDoc(postsRef, data);
  } catch (e) {
    console.log(e);
  }
};
