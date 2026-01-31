"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <>
      <div className="text-4xl text-center">
        <p className="p-5">This is a Homepage</p>
        <Link href={"/api/auth/signin"}>
          <button className="border rounded px-4 py-5 hover:bg-gray-500">
            Login
          </button>
        </Link>{" "}
        <p>
          User data{" "}
          {status == "authenticated" ? JSON.stringify(session) : "null"}{" "}
        </p>
        <button
          className="border rounded px-4 py-5 hover:bg-gray-500"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    </>
  );
}
