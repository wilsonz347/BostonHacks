import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { x_asec, y_asec } = body;

    // Create a Promise to handle the Python process
    const pythonResult = await new Promise((resolve, reject) => {
      // Spawn Python process
      const pythonProcess = spawn('python', ['python_scripts/predict_solar.py', x_asec, y_asec]);
      
      let result = '';
      let error = '';

      // Collect data from Python script
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error));
        } else {
          resolve(result.trim());
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      prediction: pythonResult,
      coordinates: { x_asec, y_asec }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}