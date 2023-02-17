function Q() {
  let q = [];
  let inProcess = false;

  const process = async () => {
    try {
      inProcess = true;
      let result = await q[0].func();
      q[0].resolve(result);
    } catch (err) {
      console.error('ERROR in Q.process : ', err);
    }

    q.splice(0, 1);

    if (q.length != 0)
      process();
    else
      inProcess = false;
  }

  this.add = async (func) => new Promise((resolve) => {
    if (!func) {
      console.error('func is undefined');
    } else {
      q.push({ func, resolve });
      if (!inProcess)
        process();
    }

  })
}

module.exports = Q