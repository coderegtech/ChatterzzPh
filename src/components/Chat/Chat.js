import React, { useState, useEffect, useRef } from "react";
import SideMenu from "./SideMenu";
import { AiOutlineSend } from "react-icons/ai";
import "./style/chat.css";
import "./style/responsive.css";
import { db } from "../../firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

function Chat({ user }) {
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const scroll = useRef();
  const { photoURL, uid } = user;
  const colRef = collection(db, "messages");
  const q = query(colRef, orderBy("createdAt"));

  useEffect(() => {
    const getMsg = async () => {
      // console.log(messages.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      // onSnapshot(q, (snapshot) => {
      //   setMsg(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      // });
      const messages = await getDocs(q);
      setMsg(messages.docs.map((doc) => ({ ...doc.data(), id: doc.id })));

      scroll.current.scrollIntoView({ behavior: "smooth" });
    };
    getMsg();
  }, []);

  const submitMessage = async () => {
    const newMsg = {
      message: msgInput,
      photoURL,
      uid,
      createdAt: serverTimestamp(),
    };
    await addDoc(colRef, newMsg)
      .then(() => {
        console.log("Message Added!");
      })
      .catch((error) => {
        console.log(error);
      });
    scroll.current.scrollIntoView({ behavior: "smooth" });
    setMsgInput("");
  };

  // const deleteMsg = async (id) => {
  //   const userMsg = doc(db, "messages", id);
  //   await deleteDoc(userMsg).then((result) => {
  //     console.log("Message Deleted!");
  //   });
  // };

  return (
    <div className="chat-container">
      <SideMenu active={active} user={user} />
      <div className={`chat ${active ? "active" : ""}`}>
        <div className="chat-header">
          <div
            className={`toggle-menu ${active ? "active" : ""}`}
            onClick={() => setActive(!active)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <ul className="chat-box">
          {msg.map(({ id, displayName, photoURL, message, uid }) => {
            return (
              <li
                // onClick={() => deleteMsg(id)}
                key={id}
                className={`msg-content ${
                  uid === user.uid ? "sent" : "received"
                }`}
              >
                <img
                  className="user-profile"
                  src={photoURL}
                  alt={displayName}
                />
                <p className="msg">{message}</p>
              </li>
            );
          })}
          <div ref={scroll}></div>
        </ul>
        <form
          onSubmit={(e) => submitMessage(e.preventDefault())}
          className="msg-form"
        >
          <input
            className="msg-input"
            type="text"
            placeholder="Type a message..."
            onChange={(e) => setMsgInput(e.target.value)}
            value={msgInput}
          />
          <button
            type="button"
            disabled={!msgInput}
            onClick={(e) => submitMessage(e.preventDefault())}
            className="btn submit-msg-btn"
          >
            <AiOutlineSend className="btn-icon" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
