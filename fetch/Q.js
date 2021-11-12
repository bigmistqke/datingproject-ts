function Q() {
  let q = [];
  let inProcess = false;

  const _process = async () => {
    try {
      inProcess = true;
      let result = await q[0].func(q[0].vars);
      q[0].resolve(result);

    } catch (err) {
      console.error('ERROR in Q.process : ', err);
    }

    q.splice(0, 1);
    if (q.length != 0)
      _process();
    else
      inProcess = false;
  }

  this.add = async ({ func, vars }) => new Promise((resolve) => {
    q.push({ func, vars, resolve });
    if (!inProcess)
      _process();
  })
}

module.exports = Q