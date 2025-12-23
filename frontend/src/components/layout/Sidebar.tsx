import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
} from "react-icons/hi";
import logo from "../../assets/logo2.png";
import dotArtwork from "../../assets/IG.png";

import { IoMenu } from "react-icons/io5";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: HiOutlineChartBar,
  },
  {
    id: "new-requirement",
    label: "New Requirement",
    path: "/requirements/new",
    icon: HiOutlineClipboardList,
  },
  {
    id: "shortlist",
    label: "Shortlist",
    path: "/shortlist",
    icon: HiOutlineUserGroup,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <div className="p-2 md:hidden">
        <button
          className="rounded bg-[color:var(--ig-blue)] p-2 text-white shadow-sm"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="block h-0.5 w-4 bg-white" />
          <span className="mt-1 block h-0.5 w-4 bg-white" />
          <span className="mt-1 block h-0.5 w-4 bg-white" />
        </button>
      </div>

      <aside
        className={`fixed z-40 flex h-screen flex-col bg-[color:var(--ig-blue)] text-white transition-all duration-300 md:static ${
          open ? "w-[270px]" : "w-[60px]"
        }`}
        onClick={() => {
          if (!open) setOpen(true);
        }}
      >
        {/* Header */}
        <header className="flex h-[50px] w-full items-center border-b border-white/20 px-2">
          <button
            onClick={handleToggle}
            className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-white hover:bg-white/10"
          >
            <IoMenu size={24} />
          </button>

          {open && (
            <>
              <div className="mr-2 flex items-center">
                <div
                  className="flex h-[30px] w-[40px] items-center justify-center rounded-lg"
                  style={{ background: "#00283c" }}
                >
                  <img
                    src={logo}
                    alt="IG Secondary Logo"
                    width={43}
                    height={43}
                    className="ml-2 rounded"
                  />
                </div>
              </div>
              <span className="font-inter text-[20px] font-semibold leading-6 text-white md:text-[24px]">
                Evergreen
              </span>
            </>
          )}
        </header>

        <div
          className="flex-1 relative min-h-0 flex flex-col"
          style={
            open
              ? {
                  backgroundImage: `url(${dotArtwork})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center bottom",
                  backgroundSize: "260px auto",
                  backgroundAttachment: "local",
                }
              : {}
          }
        >
          <div className="custom-scrollbar flex-1 overflow-y-auto p-2 min-h-0">
            {open ? (
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path)}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                        active
                          ? "bg-[#234F69] font-medium text-white"
                          : "text-gray-300 hover:bg-[#003d54] hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center gap-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavClick(item.path);
                      }}
                      className={`relative p-2 transition-colors ${
                        active
                          ? "text-[color:var(--highlight-yellow)]"
                          : "hover:text-[#234F69]"
                      }`}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with simple profile + “Evergreen AI” */}
        <footer className="flex h-[60px] w-full items-center border-t border-[#234F69] bg-[color:var(--ig-blue)] px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7E8CA3] text-xs font-semibold text-[#F6F6F6]">
              SG
            </div>
            {open && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-semibold text-[#F6F6F6]">
                  Shivaganesh Boggarapu
                </span>
                <span className="truncate text-[12px] text-[#7E8CA3]">
                  shivaganesh@insightglobal.com
                </span>
              </div>
            )}
          </div>
        </footer>
      </aside>
    </>
  );
};

export default Sidebar;
