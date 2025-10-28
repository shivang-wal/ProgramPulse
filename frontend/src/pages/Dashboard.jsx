import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectHistoryDialog = ({ project, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API}/projects/${project.id}/history`);
        setHistory(response.data);
      } catch (error) {
        toast.error('Failed to load project history');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (project) {
      fetchHistory();
    }
  }, [project]);

  return (
    <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="history-dialog">
      <DialogHeader>
        <DialogTitle>Project Update History - {project.name}</DialogTitle>
        <DialogDescription>
          View all previous weekly updates for this project
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="h-[600px] pr-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No update history yet. History will be saved when you update this project.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id} className="history-entry" data-testid={`history-entry-${index}`}>
                <div className="history-header">
                  <div className="history-date">
                    {format(new Date(entry.updatedAt), 'MMMM dd, yyyy - h:mm a')}
                  </div>
                  <span className={`status-badge status-${entry.status.toLowerCase().replace(' ', '-')}`}>
                    {entry.status}
                  </span>
                </div>
                
                <div className="history-content">
                  {entry.completedThisWeek && (
                    <div className="history-section">
                      <div className="history-label">Completed This Week</div>
                      <div className="history-text">{entry.completedThisWeek}</div>
                    </div>
                  )}
                  
                  {entry.risks && (
                    <div className="history-section">
                      <div className="history-label">Risks</div>
                      <div className="history-text">{entry.risks}</div>
                    </div>
                  )}
                  
                  {entry.escalation && (
                    <div className="history-section">
                      <div className="history-label">Escalation</div>
                      <div className="history-text">{entry.escalation}</div>
                    </div>
                  )}
                  
                  {entry.plannedNextWeek && (
                    <div className="history-section">
                      <div className="history-label">Planned Next Week</div>
                      <div className="history-text">{entry.plannedNextWeek}</div>
                    </div>
                  )}
                  
                  <div className="history-section">
                    <div className="history-label">Bugs Count</div>
                    <div className="history-text">{entry.bugsCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onClose} data-testid="close-history-button">
          Close
        </Button>
      </div>
    </DialogContent>
  );
};

const ProjectDialog = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    status: project?.status || 'On Track',
    completedThisWeek: project?.completedThisWeek || '',
    risks: project?.risks || '',
    escalation: project?.escalation || '',
    plannedNextWeek: project?.plannedNextWeek || '',
    bugs: {
      critical: project?.bugs?.critical || 0,
      high: project?.bugs?.high || 0,
      medium: project?.bugs?.medium || 0,
      low: project?.bugs?.low || 0,
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (project) {
        await axios.put(`${API}/projects/${project.id}`, formData);
        toast.success('Project updated successfully');
      } else {
        await axios.post(`${API}/projects`, formData);
        toast.success('Project created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save project');
      console.error(error);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="project-dialog">
      <DialogHeader>
        <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogDescription>
          {project ? 'Update project details and weekly sprint information' : 'Add a new project to track weekly sprint progress'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="project-name-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            data-testid="project-status-select"
          >
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Completed This Week</label>
          <textarea
            className="form-textarea"
            value={formData.completedThisWeek}
            onChange={(e) => setFormData({ ...formData, completedThisWeek: e.target.value })}
            data-testid="completed-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Risks</label>
          <textarea
            className="form-textarea"
            value={formData.risks}
            onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
            data-testid="risks-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Escalation</label>
          <textarea
            className="form-textarea"
            value={formData.escalation}
            onChange={(e) => setFormData({ ...formData, escalation: e.target.value })}
            data-testid="escalation-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Planned Next Week</label>
          <textarea
            className="form-textarea"
            value={formData.plannedNextWeek}
            onChange={(e) => setFormData({ ...formData, plannedNextWeek: e.target.value })}
            data-testid="planned-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bug Severity Breakdown</label>
          <div className="bugs-severity-grid">
            <div className="severity-input-group">
              <label className="severity-label">Critical</label>
              <input
                type="number"
                className="form-input-small"
                value={formData.bugs.critical}
                onChange={(e) => setFormData({
                  ...formData,
                  bugs: { ...formData.bugs, critical: parseInt(e.target.value) || 0 }
                })}
                min="0"
                data-testid="bugs-critical-input"
              />
            </div>
            <div className="severity-input-group">
              <label className="severity-label">High</label>
              <input
                type="number"
                className="form-input-small"
                value={formData.bugs.high}
                onChange={(e) => setFormData({
                  ...formData,
                  bugs: { ...formData.bugs, high: parseInt(e.target.value) || 0 }
                })}
                min="0"
                data-testid="bugs-high-input"
              />
            </div>
            <div className="severity-input-group">
              <label className="severity-label">Medium</label>
              <input
                type="number"
                className="form-input-small"
                value={formData.bugs.medium}
                onChange={(e) => setFormData({
                  ...formData,
                  bugs: { ...formData.bugs, medium: parseInt(e.target.value) || 0 }
                })}
                min="0"
                data-testid="bugs-medium-input"
              />
            </div>
            <div className="severity-input-group">
              <label className="severity-label">Low</label>
              <input
                type="number"
                className="form-input-small"
                value={formData.bugs.low}
                onChange={(e) => setFormData({
                  ...formData,
                  bugs: { ...formData.bugs, low: parseInt(e.target.value) || 0 }
                })}
                min="0"
                data-testid="bugs-low-input"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-button">
            Cancel
          </Button>
          <Button type="submit" data-testid="save-project-button">
            {project ? 'Update' : 'Create'} Project
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

const BugsTable = ({ bugs, statusColors }) => {
  const bugData = bugs || { critical: 0, high: 0, medium: 0, low: 0 };
  
  const totalByCriteria = {
    critical: bugData.critical,
    high: bugData.high,
    medium: bugData.medium,
    low: bugData.low
  };
  
  const totalBySeverity = {
    critical: bugData.critical,
    high: bugData.high,
    medium: bugData.medium,
    low: bugData.low
  };
  
  const grandTotal = bugData.critical + bugData.high + bugData.medium + bugData.low;
  
  return (
    <div className="bugs-table-container" style={{ borderColor: statusColors.border }}>
      <div className="bugs-table-header">
        <span className="bugs-table-title">🐛 Bug Severity Matrix</span>
        <span className="bugs-total-count">Total: {grandTotal}</span>
      </div>
      <table className="bugs-table">
        <thead>
          <tr>
            <th>Severity/Priority</th>
            <th>1-Critical</th>
            <th>2-High</th>
            <th>3-Medium</th>
            <th>4-Low</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Critical</strong></td>
            <td>{bugData.critical}</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td><strong>{totalBySeverity.critical}</strong></td>
          </tr>
          <tr>
            <td><strong>High</strong></td>
            <td>0</td>
            <td>{bugData.high}</td>
            <td>0</td>
            <td>0</td>
            <td><strong>{totalBySeverity.high}</strong></td>
          </tr>
          <tr>
            <td><strong>Medium</strong></td>
            <td>0</td>
            <td>0</td>
            <td>{bugData.medium}</td>
            <td>0</td>
            <td><strong>{totalBySeverity.medium}</strong></td>
          </tr>
          <tr>
            <td><strong>Low</strong></td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>{bugData.low}</td>
            <td><strong>{totalBySeverity.low}</strong></td>
          </tr>
          <tr className="total-row">
            <td><strong>Total</strong></td>
            <td><strong>{totalByCriteria.critical}</strong></td>
            <td><strong>{totalByCriteria.high}</strong></td>
            <td><strong>{totalByCriteria.medium}</strong></td>
            <td><strong>{totalByCriteria.low}</strong></td>
            <td><strong>{grandTotal}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const ProjectCard = ({ project, onEdit, onDelete, onViewHistory }) => {
  const getStatusClass = (status) => {
    const statusMap = {
      'On Track': 'status-on-track',
      'At Risk': 'status-at-risk',
      'Delayed': 'status-delayed',
      'Completed': 'status-completed',
    };
    return statusMap[status] || 'status-on-track';
  };

  const getStatusColors = (status) => {
    const colorMap = {
      'On Track': {
        border: '#10b981',
        accent: '#10b981'
      },
      'At Risk': {
        border: '#f59e0b',
        accent: '#f59e0b'
      },
      'Delayed': {
        border: '#ef4444',
        accent: '#ef4444'
      },
      'Completed': {
        border: '#6366f1',
        accent: '#6366f1'
      }
    };
    return colorMap[status] || colorMap['On Track'];
  };

  const statusColors = getStatusColors(project.status);

  return (
    <div 
      className="project-card" 
      data-testid={`project-card-${project.id}`}
      style={{
        borderColor: statusColors.border,
        borderLeftWidth: '5px',
        borderLeftStyle: 'solid'
      }}
    >
      <div className="project-header">
        <div className="project-title-section">
          <h3 className="project-name" data-testid="project-name">
            {project.name}
          </h3>
          <span className={`status-badge ${getStatusClass(project.status)}`} data-testid="project-status">
            {project.status}
          </span>
        </div>
        <div className="project-actions">
          <button 
            className="icon-button" 
            onClick={() => onViewHistory(project)} 
            data-testid="view-history-button"
            title="View History"
          >
            📅
          </button>
          <button className="icon-button" onClick={() => onEdit(project)} data-testid="edit-project-button">
            ✏️
          </button>
          <button className="icon-button" onClick={() => onDelete(project.id)} data-testid="delete-project-button">
            🗑️
          </button>
        </div>
      </div>

      <div className="project-content">
        {project.completedThisWeek && (
          <div className="project-section" style={{ borderLeftColor: statusColors.accent }}>
            <div className="section-label">Completed This Week</div>
            <div className="section-content" data-testid="completed-content">{project.completedThisWeek}</div>
          </div>
        )}

        {project.risks && (
          <div className="project-section" style={{ borderLeftColor: statusColors.accent }}>
            <div className="section-label">Risks</div>
            <div className="section-content" data-testid="risks-content">{project.risks}</div>
          </div>
        )}

        {project.escalation && (
          <div className="project-section" style={{ borderLeftColor: statusColors.accent }}>
            <div className="section-label">Escalation</div>
            <div className="section-content" data-testid="escalation-content">{project.escalation}</div>
          </div>
        )}

        {project.plannedNextWeek && (
          <div className="project-section" style={{ borderLeftColor: statusColors.accent }}>
            <div className="section-label">Planned Next Week</div>
            <div className="section-content" data-testid="planned-content">{project.plannedNextWeek}</div>
          </div>
        )}

        <BugsTable bugs={project.bugs} statusColors={statusColors} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingHistoryProject, setViewingHistoryProject] = useState(null);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleEdit = (project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleViewHistory = (project) => {
    setViewingHistoryProject(project);
    setHistoryDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`${API}/projects/${id}`);
        toast.success('Project deleted successfully');
        fetchProjects();
      } catch (error) {
        toast.error('Failed to delete project');
        console.error(error);
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  const handleHistoryDialogClose = () => {
    setHistoryDialogOpen(false);
    setViewingHistoryProject(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <h2 className="empty-title">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Project Dashboard</h1>
            <p className="page-subtitle">Manage all your LucyRx initiatives with weekly sprint tracking</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button 
                onClick={handleCreate} 
                data-testid="create-project-button"
                className="create-project-btn"
              >
                + Create Project
              </button>
            </DialogTrigger>
            {dialogOpen && (
              <ProjectDialog
                project={editingProject}
                onClose={handleDialogClose}
                onSave={fetchProjects}
              />
            )}
          </Dialog>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">No Projects Yet</h2>
          <p className="empty-text">Create your first project to start tracking progress</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        {historyDialogOpen && viewingHistoryProject && (
          <ProjectHistoryDialog
            project={viewingHistoryProject}
            onClose={handleHistoryDialogClose}
          />
        )}
      </Dialog>
    </div>
  );
};

export default Dashboard;