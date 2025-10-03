import Layout from "./Layout";
import { motion } from "framer-motion";
import ChatList from "../pages/chats/ChatList";
import { useEffect, useState } from "react";
import { getAllUsers } from "../services/user.service";
const Home = () => {
  const [allUsers, setAllUsers] = useState([]);
  const getUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.status === "success") {
        const users = Array.isArray(response.data.users)
          ? response.data.users
          : [];
        setAllUsers(users);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  );
};

export default Home;
