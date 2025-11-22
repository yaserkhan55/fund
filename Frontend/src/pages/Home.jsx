// src/pages/Home.jsx

import React from "react";
import Hero from "../components/Hero";
import TrendingFundraisers from "../components/TrendingFundraisers";
import Categories from "../components/Categories";
import SuccessStories from "../components/SuccessStories";

import FAQ from "../components/FAQ";

function Home() {
  return (
    <>
      <Hero />

      <TrendingFundraisers />
      <Categories />
      <SuccessStories />
      <FAQ />
    </>
  );
}

export default Home;
