"use client";

import { Avatar } from "@/app/messages/page";
import { useToast } from "@/components/Toastify";
import { DeleteChat } from "@/config/hooks";
import { useRouter } from "next/navigation";
import { CloseIcon } from "./Icons";

export const SideMenu = ({
  open,
  close,
  photoURL,
  isOnline,
  name,
  convoId,
}) => {
  const toast = useToast();
  const router = useRouter();

  const handleDeleteConvo = async () => {
    await DeleteChat(convoId);
    toast("success", "Message successfully removed!");
    router.push("/messages");
  };

  return (
    <div
      className={`absolute max-w-80 w-full h-full top-0 z-[100] p-6 
      bg-gradient-to-b from-indigo-900 to-black 
      transition-all duration-300 ease-in-out 
      ${open ? "right-0" : "-right-full"}`}
    >
      <header className="w-full flex justify-end">
        <div onClick={close}>
          <CloseIcon size={"30"} />
        </div>
      </header>

      <div className="py-4 flex flex-col justify-center gap-y-2 items-center">
        <Avatar photoURL={photoURL} size={"80"} isOnline={isOnline} />
        <p className="text-lg">{name}</p>
      </div>

      <div className="py-4">
        <ul>
          <li
            onClick={handleDeleteConvo}
            className="border-b border-white/5 p-2 hover:bg-white/5 cursor-pointer
            flex items-center gap-x-2"
          >
            <span>
              <svg
                version="1.1"
                id="Capa_1"
                x="0px"
                y="0px"
                viewBox="0 0 512 512"
                width="20"
                height="20"
                fill="#ef4444"
              >
                <g>
                  <path d="M448,85.333h-66.133C371.66,35.703,328.002,0.064,277.333,0h-42.667c-50.669,0.064-94.327,35.703-104.533,85.333H64   c-11.782,0-21.333,9.551-21.333,21.333S52.218,128,64,128h21.333v277.333C85.404,464.214,133.119,511.93,192,512h128   c58.881-0.07,106.596-47.786,106.667-106.667V128H448c11.782,0,21.333-9.551,21.333-21.333S459.782,85.333,448,85.333z    M234.667,362.667c0,11.782-9.551,21.333-21.333,21.333C201.551,384,192,374.449,192,362.667v-128   c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M320,362.667   c0,11.782-9.551,21.333-21.333,21.333c-11.782,0-21.333-9.551-21.333-21.333v-128c0-11.782,9.551-21.333,21.333-21.333   c11.782,0,21.333,9.551,21.333,21.333V362.667z M174.315,85.333c9.074-25.551,33.238-42.634,60.352-42.667h42.667   c27.114,0.033,51.278,17.116,60.352,42.667H174.315z" />
                </g>
              </svg>
            </span>

            <p className="text-base text-red-500">Delete chat </p>
          </li>
        </ul>
      </div>
    </div>
  );
};
