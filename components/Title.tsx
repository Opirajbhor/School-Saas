import React from "react";

const Title = ({ title }: { title: string }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
        {title}
      </h2>
    </div>
  );
};

export default Title;
