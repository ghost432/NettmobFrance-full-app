import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MissionsPublishedChart = ({ data, title, description }) => {
  const calculateTrend = () => {
    if (data.length < 2) return { value: 0, direction: 'stable' };
    
    const recent = data.slice(-4);
    const older = data.slice(-8, -4);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.missions, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, item) =>
         sum + item.missions, 0) / older.length 
      : recentAvg;
    
    const percentChange = olderAvg > 0 
      ? ((recentAvg - olderAvg) / olderAvg) * 100 
      : 0;
    
    return {
      value: Math.abs(percentChange).toFixed(1),
      direction: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable'
    };
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendText = () => {
    switch (trend.direction) {
      case 'up':
        return `+${trend.value}% vs période précédente`;
      case 'down':
        return `-${trend.value}% vs période précédente`;
      default:
        return 'Stable';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`flex items-center gap-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{getTrendText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="missions" 
              fill="#3b82f6" 
              name="Missions publiées"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ExpensesChart = ({ data, title, description }) => {
  const calculateTrend = () => {
    if (data.length < 2) return { value: 0, direction: 'stable' };
    
    const recent = data.slice(-4);
    const older = data.slice(-8, -4);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.expenses, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, item) => sum + item.expenses, 0) / older.length 
      : recentAvg;
    
    const percentChange = olderAvg > 0 
      ? ((recentAvg - olderAvg) / olderAvg) * 100 
      : 0;
    
    return {
      value: Math.abs(percentChange).toFixed(1),
      direction: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable'
    };
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-orange-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendText = () => {
    switch (trend.direction) {
      case 'up':
        return `+${trend.value}% vs période précédente`;
      case 'down':
        return `-${trend.value}% vs période précédente`;
      default:
        return 'Stable';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`flex items-center gap-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{getTrendText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
              name="Dépenses (€)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ApplicationsReceivedChart = ({ data, title, description }) => {
  const calculateTrend = () => {
    if (data.length < 2) return { value: 0, direction: 'stable' };
    
    const recent = data.slice(-4);
    const older = data.slice(-8, -4);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.applications, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, item) => sum + item.applications, 0) / older.length 
      : recentAvg;
    
    const percentChange = olderAvg > 0 
      ? ((recentAvg - olderAvg) / olderAvg) * 100 
      : 0;
    
    return {
      value: Math.abs(percentChange).toFixed(1),
      direction: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable'
    };
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendText = () => {
    switch (trend.direction) {
      case 'up':
        return `+${trend.value}% vs période précédente`;
      case 'down':
        return `-${trend.value}% vs période précédente`;
      default:
        return 'Stable';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`flex items-center gap-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{getTrendText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="applications" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 4 }}
              activeDot={{ r: 6 }}
              name="Candidatures reçues"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
