// src/pages/Home.jsx

import React from "react";
import Hero from "../components/Hero";
import TrendingFundraisers from "../components/TrendingFundraisers";
import SuccessStories from "../components/SuccessStories";

import FAQ from "../components/FAQ";

function Home() {
  return (
    <>
      <Hero />

      <TrendingFundraisers />
      <SuccessStories />
      <FAQ />
    </>
  );
}

export default Home;
