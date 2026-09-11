import {ReactNode} from 'react';
export default function StatCard({label,value,icon}:{label:string;value:string|number;icon:ReactNode}){return <div className="stat"><div className="stat-icon">{icon}</div><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>}
