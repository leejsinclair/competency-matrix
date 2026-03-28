import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const router = Router();
const execAsync = promisify(exec);

// POST /api/processing/reprocess - Trigger data reprocessing
router.post('/reprocess', async (req, res) => {
  try {
    console.log('🔄 Starting data reprocessing...');
    
    const { enableRuleEngine = true, regenerateScores = true } = req.body;
    
    // Run the data processing script
    const scriptPath = path.join(process.cwd(), 'scripts/process-local-confluence.js');
    
    try {
      const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
      console.log('✅ Data processing completed:', stdout);
      
      if (stderr) {
        console.warn('⚠️ Processing warnings:', stderr);
      }
      
      // Parse results from stdout to get processed events count
      const processedEvents = parseProcessedEvents(stdout);
      
      res.json({
        success: true,
        message: 'Data reprocessing completed successfully',
        processedEvents,
        enableRuleEngine,
        regenerateScores
      });
      
    } catch (scriptError) {
      console.error('❌ Script execution failed:', scriptError);
      
      // Try fallback to score generation only
      if (regenerateScores) {
        console.log('🔄 Falling back to score generation only...');
        try {
          const scoresScriptPath = path.join(process.cwd(), 'scripts/generate-competency-scores.js');
          const { stdout: scoresStdout } = await execAsync(`node ${scoresScriptPath}`);
          
          const scoresGenerated = parseScoresGenerated(scoresStdout);
          
          res.json({
            success: true,
            message: 'Score generation completed (data processing failed)',
            processedEvents: 0,
            scoresGenerated,
            warning: 'Data processing failed, but scores were regenerated'
          });
          
        } catch (scoresError) {
          console.error('❌ Score generation also failed:', scoresError);
          throw scoresError;
        }
      } else {
        throw scriptError;
      }
    }
    
  } catch (error) {
    console.error('❌ Reprocessing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reprocess data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/processing/generate-scores - Generate competency scores
router.post('/generate-scores', async (req, res) => {
  try {
    console.log('🔄 Generating competency scores...');
    
    // Run the score generation script
    const scriptPath = path.join(process.cwd(), 'scripts/generate-competency-scores.js');
    
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    console.log('✅ Score generation completed:', stdout);
    
    if (stderr) {
      console.warn('⚠️ Score generation warnings:', stderr);
    }
    
    const scoresGenerated = parseScoresGenerated(stdout);
    
    res.json({
      success: true,
      message: 'Competency scores generated successfully',
      scoresGenerated
    });
    
  } catch (error) {
    console.error('❌ Score generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate competency scores',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/processing/status - Get processing status
router.get('/status', async (req, res) => {
  try {
    // This could check database for last processing time, job status, etc.
    // For now, return a simple status
    res.json({
      success: true,
      status: 'ready',
      lastProcessed: new Date().toISOString(),
      availableOperations: ['reprocess', 'generate-scores']
    });
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get processing status'
    });
  }
});

// Helper functions to parse script output
function parseProcessedEvents(stdout: string): number {
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.includes('Processed') && line.includes('events')) {
      const match = line.match(/Processed\s+(\d+)\s+events/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }
  return 0;
}

function parseScoresGenerated(stdout: string): number {
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.includes('Generated') && line.includes('competency scores')) {
      const match = line.match(/Generated\s+(\d+)\s+competency\s+scores/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }
  return 0;
}

export default router;
