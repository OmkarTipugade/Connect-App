import Layout from "./Layout";
import { motion } from "framer-motion";
import ChatList from "../pages/chats/ChatList";
import { useEffect, useState } from "react";
import { getAllUsers } from "../services/user.service";
import { useChatStore } from "../store/chatStore";
import useUserStore from "../store/UseUserStore";

const Home = () => {
  const [allUsers, setAllUsers] = useState([]);
  const user = useUserStore((state) => state.user);
  const requestUserStatus = useChatStore((state) => state.requestUserStatus);

  const getUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.status === "success") {
        const users = Array.isArray(response.data.users)
          ? response.data.users
          : [];
        setAllUsers(users);
        users.forEach((contact) => {
          if (contact?.id) requestUserStatus(contact.id);
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      getUsers();
    }
  }, [user?.id]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={allUsers} onContactsRefresh={getUsers} />
      </motion.div>
    </Layout>
  );
};

export default Home;
