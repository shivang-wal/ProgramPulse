import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectDialog = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    status: project?.status || 'On Track',
    completedThisWeek: project?.completedThisWeek || '',
    risks: project?.risks || '',
    escalation: project?.escalation || '',
    plannedNextWeek: project?.plannedNextWeek || '',
    bugsCount: project?.bugsCount || 0,
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
          <label className="form-label">Bugs Count</label>
          <input
            type="number"
            className="form-input"
            value={formData.bugsCount}
            onChange={(e) => setFormData({ ...formData, bugsCount: parseInt(e.target.value) || 0 })}
            min="0"
            data-testid="bugs-count-input"
          />
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

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const getStatusClass = (status) => {
    const statusMap = {
      'On Track': 'status-on-track',
      'At Risk': 'status-at-risk',
      'Delayed': 'status-delayed',
      'Completed': 'status-completed',
    };
    return statusMap[status] || 'status-on-track';
  };

  return (
    <div className="project-card" data-testid={`project-card-${project.id}`}>
      <div className="project-header">
        <div className="project-title-section">
          <h3 className="project-name" data-testid="project-name">{project.name}</h3>
          <span className={`status-badge ${getStatusClass(project.status)}`} data-testid="project-status">
            {project.status}
          </span>
        </div>
        <div className="project-actions">
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
          <div className="project-section">
            <div className="section-label">Completed This Week</div>
            <div className="section-content" data-testid="completed-content">{project.completedThisWeek}</div>
          </div>
        )}

        {project.risks && (
          <div className="project-section">
            <div className="section-label">Risks</div>
            <div className="section-content" data-testid="risks-content">{project.risks}</div>
          </div>
        )}

        {project.escalation && (
          <div className="project-section">
            <div className="section-label">Escalation</div>
            <div className="section-content" data-testid="escalation-content">{project.escalation}</div>
          </div>
        )}

        {project.plannedNextWeek && (
          <div className="project-section">
            <div className="section-label">Planned Next Week</div>
            <div className="section-content" data-testid="planned-content">{project.plannedNextWeek}</div>
          </div>
        )}

        <div className="bugs-count" data-testid="bugs-count">
          <span>🐛 Bugs Count</span>
          <span>{project.bugsCount}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

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
            <p className="page-subtitle">Manage up to 5 projects with weekly sprint tracking</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} data-testid="create-project-button">
                + Create Project
              </Button>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;