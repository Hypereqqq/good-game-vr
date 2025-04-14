import React from "react";
import { Outlet } from "react-router-dom"

import ScrollToTop from "../components/ScrollToTop";
import ScrollToTopButton from "../components/ScrollToTopButton";
import Navbar from "../components/NavBar";
import Footer from "../components/Footer";


const App: React.FC = () => {
  return (
    <div className="">
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <ScrollToTopButton />
      <Footer />
    </div>
  );
}

export default App;