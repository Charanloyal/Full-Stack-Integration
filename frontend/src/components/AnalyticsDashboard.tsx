import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string; // 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: string; // 'LOW' | 'MEDIUM' | 'HIGH'
  user: User;
}

interface AnalyticsDashboardProps {
  tasks: Task[];
}

export default function AnalyticsDashboard({ tasks }: AnalyticsDashboardProps) {
  // 1. Calculate Status Distribution
  const total = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const statusData = [
    { name: 'To Do', value: todoCount, color: '#818cf8' },
    { name: 'In Progress', value: inProgressCount, color: '#fbbf24' },
    { name: 'Done', value: doneCount, color: '#34d399' },
  ].filter(d => d.value > 0);

  // 2. Calculate Workload (Tasks per User)
  const workloadMap: { [key: string]: { name: string; todo: number; inProgress: number; done: number; total: number } } = {};
  
  tasks.forEach((task) => {
    const u = task.user;
    if (!workloadMap[u.id]) {
      workloadMap[u.id] = { name: u.name, todo: 0, inProgress: 0, done: 0, total: 0 };
    }
    workloadMap[u.id].total += 1;
    if (task.status === 'TODO') workloadMap[u.id].todo += 1;
    if (task.status === 'IN_PROGRESS') workloadMap[u.id].inProgress += 1;
    if (task.status === 'DONE') workloadMap[u.id].done += 1;
  });

  const workloadData = Object.values(workloadMap);

  // 3. Calculate Priority Distribution
  const lowCount = tasks.filter((t) => t.priority === 'LOW').length;
  const medCount = tasks.filter((t) => t.priority === 'MEDIUM' || !t.priority).length;
  const highCount = tasks.filter((t) => t.priority === 'HIGH').length;

  const priorityData = [
    { name: 'Low', value: lowCount, color: '#38bdf8' },
    { name: 'Medium', value: medCount, color: '#fb7185' },
    { name: 'High', value: highCount, color: '#f43f5e' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', padding: '10px 4px' }}>
      
      {/* Summary Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Tasks</h4>
          <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>{total}</p>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Completed</h4>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#34d399' }}>{doneCount}</p>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Active Tasks</h4>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#fbbf24' }}>{todoCount + inProgressCount}</p>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Completion Rate</h4>
          <p style={{ fontSize: '32px', fontWeight: '800', color: '#818cf8' }}>{completionRate}%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '20px' }}>
        
        {/* Status Distribution Donut */}
        <div className="glass-card" style={{ padding: '24px', minHeight: '340px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>Task Status Distribution</h3>
          {total === 0 ? (
            <div style={{ display: 'flex', height: '220px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No data available
            </div>
          ) : (
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Priority Level Breakdown */}
        <div className="glass-card" style={{ padding: '24px', minHeight: '340px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>Priority Distribution</h3>
          {total === 0 ? (
            <div style={{ display: 'flex', height: '220px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No data available
            </div>
          ) : (
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="value" name="Tasks count">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Team Workload Breakdown */}
      <div className="glass-card" style={{ padding: '24px', minHeight: '360px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>Team Member Workload</h3>
        {workloadData.length === 0 ? (
          <div style={{ display: 'flex', height: '240px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No team activity yet
          </div>
        ) : (
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Bar dataKey="todo" name="To Do" fill="#818cf8" stackId="a" />
                <Bar dataKey="inProgress" name="In Progress" fill="#fbbf24" stackId="a" />
                <Bar dataKey="done" name="Done" fill="#34d399" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
