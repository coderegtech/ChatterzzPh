"use client";

import { auth } from "@/config/firebase";
import { fetchAllUsers } from "@/config/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Avatar,
  BottomNavigation,
  MessagesIcon,
  SearchIcon,
} from "../messages/page";

const UsersScreen = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        await fetchAllUsers((data) => {
          const exceptMe = data.filter(
            (item) => item.uid !== auth?.currentUser?.uid
          );
          setUsers(exceptMe);
        });
      } catch (e) {
        console.log(e);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-900 to-black text-white">
      {/* Header */}
      <div className="bg-black bg-opacity-40 backdrop-blur-lg p-4 border-b border-indigo-900/30">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Users
        </h1>
      </div>

      {/* Search Input */}
      <div className=" flex items-center gap-x-2 m-4 px-4 py-2 rounded-lg bg-black bg-opacity-30 text-white placeholder-gray-400 border border-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-500">
        <SearchIcon />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="flex-1 bg-transparent focus:outline-none focus:border-none"
        />
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center space-x-4 bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-2 px-4 border border-indigo-900/30 hover:bg-opacity-60 transition  justify-between"
          >
            <div className="flex justify-start items-center gap-x-3">
              <Avatar
                photoURL={user.photoURL}
                isOnline={user.status}
                size={30}
              />
              <div>
                <p className="font-medium text-sm">{user.displayName}</p>
                <p className="text-sm text-cyan-400">
                  {user.status === "online" ? "online" : "offline"}
                </p>
              </div>
            </div>

            <div
              onClick={() =>
                router.push(`/convo/${auth?.currentUser?.uid}/${user?.uid}`)
              }
              className=""
            >
              <MessagesIcon />
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            No users found.
          </p>
        )}
      </div>

      <BottomNavigation userId={auth?.currentUser?.uid} />
    </div>
  );
};

export default UsersScreen;
