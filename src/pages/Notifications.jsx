import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { FaRegBell, FaUser, FaPhoneAlt } from "react-icons/fa";
import { RefreshCw } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notifications");
      if (response.data?.status === "success") {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const calculateTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1f2937] flex items-center gap-2">
            <FaRegBell className="text-gray-700" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center min-w-[20px] h-[20px]">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount} total &middot; {unreadCount} unread
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-gray-500" : "text-gray-500"} /> Refresh
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No notifications found.</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-xl border flex items-start gap-4 transition-colors ${
                notification.read ? "bg-white border-gray-200" : "bg-[#f8f9fc] border-gray-200"
              }`}
            >
              <div className="bg-[#e9ecef] p-3 rounded-xl shrink-0 text-gray-600">
                <FaRegBell size={18} />
              </div>

              <div className="flex-1 mt-1">
                <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
                  {notification.title}
                </h3>
                <p className="text-[#4b5563] text-[15px] mt-1">{notification.message}</p>
                
                {notification.lead && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium bg-gray-100 px-2.5 py-1 rounded-md">
                      <FaUser className="text-gray-400" size={12} /> {notification.lead.name.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                      <FaPhoneAlt className="text-red-500" size={12} /> {notification.lead.phone}
                    </div>
                    <div className="text-[13px] text-gray-600 font-medium capitalize">
                      {notification.lead.status}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-500">
                    {calculateTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-[#1e3a8a]"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
