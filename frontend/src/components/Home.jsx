import Layout from "./Layout";
import { motion } from "framer-motion";
import ChatList from "../pages/chats/ChatList";
import { useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import useUserStore from "../store/UseUserStore";

const Home = () => {
  const user = useUserStore((state) => state.user);
  const fetchContacts = useChatStore((state) => state.fetchContacts);

  useEffect(() => {
    if (user?.id) {
      fetchContacts();
    }
  }, [user?.id, fetchContacts]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList />
      </motion.div>
    </Layout>
  );
};

export default Home;
