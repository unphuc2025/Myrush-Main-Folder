import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { RxDashboard } from "react-icons/rx";
import { BsCalendar2Event } from "react-icons/bs";
import { FiUser } from "react-icons/fi";
import { GoChecklist } from "react-icons/go"; // Or similar for bookings
import { IoIosArrowBack } from "react-icons/io";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    // const location = useLocation();
    // const { pathname } = location;

    const trigger = useRef<HTMLButtonElement | null>(null);
    const sidebar = useRef<HTMLDivElement | null>(null);

    const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
    const [sidebarExpanded] = useState(
        storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
    );

    // close on click outside
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (!sidebar.current || !trigger.current) return;
            if (
                !sidebarOpen ||
                sidebar.current.contains(target as Node) ||
                trigger.current.contains(target as Node)
            )
                return;
            setSidebarOpen(false);
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    });

    // close if the esc key is pressed
    useEffect(() => {
        const keyHandler = ({ keyCode }: KeyboardEvent) => {
            if (!sidebarOpen || keyCode !== 27) return;
            setSidebarOpen(false);
        };
        document.addEventListener('keydown', keyHandler);
        return () => document.removeEventListener('keydown', keyHandler);
    });

    useEffect(() => {
        localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
        if (sidebarExpanded) {
            document.querySelector('body')?.classList.add('sidebar-expanded');
        } else {
            document.querySelector('body')?.classList.remove('sidebar-expanded');
        }
    }, [sidebarExpanded]);

    return (
        <aside
            ref={sidebar}
            className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            {/* <!-- SIDEBAR HEADER --> */}
            <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                <NavLink to="/">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-white p-2 rounded-md">
                            <span className="font-bold text-xl">MR</span>
                        </div>
                        <span className="text-white text-2xl font-semibold">MyRush</span>
                    </div>
                </NavLink>

                <button
                    ref={trigger}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-controls="sidebar"
                    aria-expanded={sidebarOpen}
                    className="block lg:hidden"
                >
                    <IoIosArrowBack className="text-2xl text-white" />
                </button>
            </div>
            {/* <!-- SIDEBAR HEADER --> */}

            <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                {/* <!-- Sidebar Menu --> */}
                <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
                    {/* <!-- Menu Group --> */}
                    <div>
                        <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                            MENU
                        </h3>

                        <ul className="mb-6 flex flex-col gap-1.5">
                            {/* <!-- Menu Item Dashboard --> */}
                            <li>
                                <NavLink
                                    to="/"
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive && 'bg-graydark dark:bg-meta-4'
                                        }`
                                    }
                                >
                                    <RxDashboard className="text-xl" />
                                    Dashboard
                                </NavLink>
                            </li>
                            {/* <!-- Menu Item Venues --> */}
                            <li>
                                <NavLink
                                    to="/venues"
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive && 'bg-graydark dark:bg-meta-4'
                                        }`
                                    }
                                >
                                    <BsCalendar2Event className="text-xl" />
                                    Venues
                                </NavLink>
                            </li>
                            {/* <!-- Menu Item Bookings --> */}
                            <li>
                                <NavLink
                                    to="/bookings"
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive && 'bg-graydark dark:bg-meta-4'
                                        }`
                                    }
                                >
                                    <GoChecklist className="text-xl" />
                                    My Bookings
                                </NavLink>
                            </li>
                            {/* <!-- Menu Item Profile --> */}
                            <li>
                                <NavLink
                                    to="/profile"
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive && 'bg-graydark dark:bg-meta-4'
                                        }`
                                    }
                                >
                                    <FiUser className="text-xl" />
                                    Profile
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </nav>
                {/* <!-- Sidebar Menu --> */}
            </div>
        </aside>
    );
};

export default Sidebar;
