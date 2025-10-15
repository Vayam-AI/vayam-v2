"use client";

import { LoaderOne } from "./loader";

const Loading = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
    <LoaderOne />
  </div>
);

export default Loading;
