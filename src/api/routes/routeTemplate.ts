import { Router } from 'express';

/**
 * API Route Template
 * 
 * Purpose: Template for creating new API routes
 * Usage: Copy this file and modify for your specific endpoints
 * Features: Includes common patterns and error handling
 * Examples: See existing routes for reference
 */

const router = Router();

// GET /api/template
// Retrieves template data
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/template - Retrieving template data');
    
    // Add your logic here
    const data = {
      message: 'Template data retrieved successfully',
      timestamp: new Date().toISOString(),
      data: []
    };
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('GET /api/template - Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/template/:id
// Retrieves specific template item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/template/${id} - Retrieving template item`);
    
    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID parameter is required'
      });
    }
    
    // Add your logic here
    const item = {
      id: id,
      name: `Template Item ${id}`,
      description: 'This is a template item',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: item
    });
    
  } catch (error) {
    console.error(`GET /api/template/:id - Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/template
// Creates new template item
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/template - Creating template item');
    
    const { name, description, data } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }
    
    // Add your creation logic here
    const newItem = {
      id: Date.now().toString(),
      name: name,
      description: description || '',
      data: data || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Created template item: ${newItem.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Template item created successfully',
      data: newItem
    });
    
  } catch (error) {
    console.error('POST /api/template - Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/template/:id
// Updates existing template item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, data } = req.body;
    
    console.log(`PUT /api/template/${id} - Updating template item`);
    
    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID parameter is required'
      });
    }
    
    // Add your update logic here
    const updatedItem = {
      id: id,
      name: name || 'Updated Item',
      description: description || '',
      data: data || {},
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Updated template item: ${id}`);
    
    res.json({
      success: true,
      message: 'Template item updated successfully',
      data: updatedItem
    });
    
  } catch (error) {
    console.error(`PUT /api/template/:id - Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/template/:id
// Deletes template item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`DELETE /api/template/${id} - Deleting template item`);
    
    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID parameter is required'
      });
    }
    
    // Add your deletion logic here
    
    console.log(`Deleted template item: ${id}`);
    
    res.json({
      success: true,
      message: 'Template item deleted successfully'
    });
    
  } catch (error) {
    console.error(`DELETE /api/template/:id - Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/template/:id/action
// Performs action on template item
router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data } = req.body;
    
    console.log(`POST /api/template/${id}/action - Performing action: ${action}`);
    
    // Validate input
    if (!id || !action) {
      return res.status(400).json({
        success: false,
        error: 'ID and action parameters are required'
      });
    }
    
    // Add your action logic here
    const result = {
      id: id,
      action: action,
      performedAt: new Date().toISOString(),
      result: 'Action completed successfully',
      data: data || {}
    };
    
    console.log(`Action performed: ${action} on item ${id}`);
    
    res.json({
      success: true,
      message: `Action '${action}' performed successfully`,
      data: result
    });
    
  } catch (error) {
    console.error(`POST /api/template/:id/action - Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform action',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/template/:id/status
// Gets status of template item
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`GET /api/template/${id}/status - Getting item status`);
    
    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID parameter is required'
      });
    }
    
    // Add your status logic here
    const status = {
      id: id,
      status: 'active',
      lastUpdated: new Date().toISOString(),
      metrics: {
        views: 0,
        edits: 0,
        actions: 0
      }
    };
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error(`GET /api/template/:id/status - Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get item status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
