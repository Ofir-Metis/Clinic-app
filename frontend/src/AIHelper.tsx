import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function AIHelper() {
  const [command, setCommand] = useState('');

  const sendCommand = () => {
    // map command to API call (stub)
    console.log('AI command:', command);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <TextField
        fullWidth
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        label="AI Helper"
      />
      <Button variant="contained" onClick={sendCommand} sx={{ mt: 1 }}>
        Send
      </Button>
    </div>
  );
}
