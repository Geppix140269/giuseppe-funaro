exports.handler = async function() {
  return {
    statusCode: 410,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'CV temporarily unavailable while career details are being re-verified.',
      contact: 'hello@giuseppefunaro.com'
    })
  };
};
