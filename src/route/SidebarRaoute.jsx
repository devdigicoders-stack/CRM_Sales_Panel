import { lazy } from "react";
import {
  FaTachometerAlt, FaIdCard, FaStar,
  FaUserCheck, FaTruck, FaCheckCircle, FaPhoneSlash,
  FaComments, FaChartLine, FaCalendarAlt, FaBell, FaUserTimes
} from "react-icons/fa";

const Dashboard             = lazy(() => import("../pages/Dashboard"));
const AssignedLeads         = lazy(() => import("../pages/AssignedLeads"));
const InterestedLeads       = lazy(() => import("../pages/InterestedLeads"));
const MissedFollowups       = lazy(() => import("../pages/MissedFollowups"));
const RejectedLeads         = lazy(() => import("../pages/RejectedLeads"));
const LeadDetails           = lazy(() => import("../pages/LeadDetails"));
const SaleConfirm           = lazy(() => import("../pages/SaleConfirm"));
const DeliveryManagement    = lazy(() => import("../pages/DeliveryManagement"));
const Profile               = lazy(() => import("../pages/Profile"));
const CommunicationHistory  = lazy(() => import("../pages/CommunicationHistory"));
const SalesAnalytics        = lazy(() => import("../pages/SalesAnalytics"));
const MeetingsManagement    = lazy(() => import("../pages/MeetingsManagement"));
const VisitsManagement      = lazy(() => import("../pages/VisitsManagement"));
const Notifications         = lazy(() => import("../pages/Notifications"));

const routes = [
  { path: "/dashboard",          component: Dashboard,          name: "Dashboard",           icon: FaTachometerAlt },
  { path: "/assigned-leads",     component: AssignedLeads,      name: "Assigned Leads",     icon: FaUserCheck     },
  { path: "/interested-leads",   component: InterestedLeads,    name: "Interested Leads",   icon: FaStar          },
  { path: "/missed-followups",   component: MissedFollowups,    name: "Missed Follow-ups",  icon: FaPhoneSlash    },
  { path: "/rejected-leads",     component: RejectedLeads,      name: "Rejected Leads",     icon: FaUserTimes     },
  { path: "/communications",     component: CommunicationHistory, name: "Communications",   icon: FaComments      },
  { path: "/meetings",           component: MeetingsManagement, name: "Meetings",           icon: FaCalendarAlt   },
  { path: "/visits",             component: VisitsManagement,   name: "Visits Calendar",    icon: FaCalendarAlt   },
  { path: "/notifications",      component: Notifications,      name: "Notifications",      icon: FaBell          },
  { path: "/sales-analytics",    component: SalesAnalytics,     name: "Sales Analytics",    icon: FaChartLine     },
  { path: "/sale-confirm/:id",   component: SaleConfirm,        name: "Sale Confirm",       icon: FaCheckCircle,  hide: true },
  { path: "/delivery/:id",       component: DeliveryManagement, name: "Delivery",           icon: FaTruck,        hide: true },
  { path: "/lead-details/:id",   component: LeadDetails,        name: "Lead Details",       icon: FaUserCheck,    hide: true },
  { path: "/profile",            component: Profile,            name: "My Profile",         icon: FaIdCard        },
];

export default routes;

