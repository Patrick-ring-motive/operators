/*  some environments have some illegal invocation that is annoying  */
globalThis.isLegal = true;
try {
  const testObj = {};
  Object.setPrototypeOf(testObj, Response.prototype);
  testObj.clone();
} catch (e) {
  if (e.message.toLowerCase().includes("illegal")) {
    globalThis.isLegal = false;
  }
}
globalThis.overwrite = function (obj, prop, val) {
  Object.defineProperty(obj, prop, {
    value: val,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  return obj;
};
globalThis.undefine = function (obj, prop, val) {
  Object.defineProperty(obj, prop, {
    value: val,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  return obj;
};
globalThis.overwriteAll = function (obj, src) {
  let keys = Object.keys(src).concat(
    Object.keys(Object.getOwnPropertyDescriptors(src)),
  );
  for (let i in src) {
    keys.push(i);
  }
  keys = Array.from(new Set(keys));
  const keys_length = keys.length;
  for (let i = 0; i < keys_length; i++) {
    try {
      overwrite(obj, keys[i], src[keys[i]]);
    } catch (e) {
      continue;
    }
  }
  return obj;
};
globalThis.legalize = function (obj, src, prop) {
  if (
    !isLegal &&
    `${typeof src[`${prop}`]}`.toLowerCase().includes("function") &&
    `${src[`${prop}`]}`.includes("native code")
  ) {
    obj[`${prop}`] = function () {
      return src[`${prop}`](...arguments);
    };
  }
  return obj;
};
globalThis.legalizeAll = function (obj, src) {
  if (Object.getPrototypeOf(obj) == Object.getPrototypeOf(src)) {
    return obj;
  }
  const srcProto = Object.getPrototypeOf(src) ?? {};
  for (prop in srcProto) {
    legalize(obj, src, prop);
  }
  for (prop in src) {
    legalize(obj, src, prop);
  }
  return obj;
};
globalThis.del = function (obj, prop) {
  overwrite(obj, prop, undefined);
  delete obj[prop];
  if (obj[prop]) {
    undefine(obj, prop);
  }
  return obj;
};
globalThis.deleteAll = function (obj) {
  let keys = Object.keys(obj).concat(
    Object.keys(Object.getOwnPropertyDescriptors(obj)),
  );
  for (let i in obj) {
    keys.push(i);
  }
  keys = Array.from(new Set(keys));
  const keys_length = keys.length;
  for (let i = 0; i < keys_length; i++) {
    try {
      del(obj, keys[i]);
    } catch (e) {
      continue;
    }
  }
  return obj;
};
globalThis.hardAssign = function (obj, src) {
  if (obj != src) {
    deleteAll(obj);
  }
  Object.setPrototypeOf(obj, src);
  overwrite(obj, src);
  legalizeAll(obj, src);
  return obj;
};
globalThis.concatUnique = function (arr1, arr2) {
  return Array.from(new Set(arr1.concat(arr2)));
};
globalThis.concatUniqueInPlace = function (target, source) {
  source.forEach((item) => {
    if (!target.includes(item)) {
      target.push(item);
    }
  });
};

globalThis.OP = function (obj, param, op, val) {
  if (arguments.length == 4) {
    switch (op) {
      case "??=":
        obj[param] = obj[param] ?? val;
        return obj[param];
      case "=??":
        obj[param] = val ?? obj[param];
      case "||=":
        obj[param] = obj[param] || val;
        return obj[param];
      case "=||":
        obj[param] = val || obj[param];
        return obj[param];
      case "&&=":
        obj[param] = obj[param] && val;
        return obj[param];
      case "=&&":
        obj[param] = val && obj[param];
      case "{}=":
        return hardAssign(obj[param] ?? {}, val ?? {});
      case "[]=":
        obj[param] = concatUnique(obj[param], val);
    }
  }
  if (arguments.length == 3) {
    switch (param) {
      case "??=":
        if (obj === null || obj === undefined) {
          return hardAssign(obj ?? {}, op ?? {});
        }
      case "=??":
        if (op === null || op === undefined) {
          return obj;
        }
        return hardAssign(obj ?? {}, op);
      case "||=":
        return hardAssign(obj, obj || op);
      case "=||":
        return hardAssign(obj, op || obj);
      case "&&=":
        return hardAssign(obj, obj && op);
      case "=&&":
        return hardAssign(obj, op && obj);
      case "{}=":
        return hardAssign(obj ?? {}, op ?? obj);
      case "[]=":
        return concatUniqueInPlace(obj, op);
    }
  }
  return obj;
};

let a = {};
OP(a, "{}=", new Response("test"));

void (async function () {
  console.log(isLegal);
  console.log(await a.text());
  del(a, "text");
  console.log(a.text);
})();
