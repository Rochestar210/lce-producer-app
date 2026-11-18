
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  CloudSun,
  ShoppingBasket,
  PlusCircle
} from "lucide-react";

import "./Navbar.css";

export default function Navbar({ lang }) {
  const location = useLocation();

  const navItems = [
    {
      path: "/",
      icon: Home,
      label: lang === "st" ? "Lehae" : "Home"
    },
    {
      path: "/weather",
      icon: CloudSun,
      label: lang === "st" ? "Leholimo" : "Weather"
    },
    {
      path: "/market",
      icon: ShoppingBasket,
      label: lang === "st" ? "Mmaraka" : "Market"
    },
    {
      path: "/post",
      icon: PlusCircle,
      label: lang === "st" ? "Rekisa" : "Post"
    }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-link ${
                isActive ? "active" : ""
              }`}
            >
              <Icon />

              <span>{item.label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
