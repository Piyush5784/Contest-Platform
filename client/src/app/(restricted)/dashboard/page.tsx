"use client";
import { useSession } from "next-auth/react";
import React from "react";

const DashboardPage = () => {
  const data = useSession();

  return <div>{JSON.stringify(data)}</div>;
};

export default DashboardPage;
