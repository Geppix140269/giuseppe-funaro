exports.handler = async function() {
  return {
    statusCode: 302,
    headers: {
      Location: '/cv.html',
      'Cache-Control': 'no-store'
    },
    body: ''
  };
};
