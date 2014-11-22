////////////////////////////////////////////////////////////////////////////////
// Start: copy from js_of_ocaml

//Provides: raw_array_sub
function raw_array_sub (a,i,l) {
  var b = new Array(l);
  for(var j = 0; j < l; j++) b[j] = a[i+j];
  return b
}

//Provides: caml_str_repeat
function caml_str_repeat(n, s) {
  if (s.repeat) return s.repeat(n); // ECMAscript 6 and Firefox 24+
  var r = "", l = 0;
  if (n == 0) return r;
  for(;;) {
    if (n & 1) r += s;
    n >>= 1;
    if (n == 0) return r;
    s += s;
    l++;
    if (l == 9) {
      s.slice(0,1); // flatten the string
      // then, the flattening of the whole string will be faster,
      // as it will be composed of larger pieces
    }
  }
}

//Provides: caml_subarray_to_string
//Requires: raw_array_sub
function caml_subarray_to_string (a, i, len) {
  var f = String.fromCharCode;
  if (i == 0 && len <= 4096 && len == a.length) return f.apply (null, a);
  var s = "";
  for (; 0 < len; i += 1024,len-=1024)
    s += f.apply (null, raw_array_sub(a,i, Math.min(len, 1024)));
  return s;
}

//Provides: caml_convert_string_to_bytes
//Requires: caml_str_repeat, caml_subarray_to_string
function caml_convert_string_to_bytes (s) {
  /* Assumes not BYTES */
  if (s.t == 2 /* PARTIAL */)
    s.c += caml_str_repeat(s.l - s.c.length, '\0')
  else
    s.c = caml_subarray_to_string (s.c, 0, s.c.length);
  s.t = 0; /*BYTES | UNKOWN*/
}

//Provides: caml_bytes_of_string mutable
//Requires: caml_convert_string_to_bytes
function caml_bytes_of_string (s) {
  if ((s.t & 6) != 0 /* BYTES */) caml_convert_string_to_bytes(s);
  return s.c;
}

//Provides: caml_mul const
if (!Math.imul)
  Math.imul =
    function (x,y) { return ((((x >> 16) * y) << 16) + (x & 0xffff) * y)|0; };
var caml_mul = Math.imul;

//Provides: ROTL32
function ROTL32(x,n) { return ((x << n) | (x >>> (32-n))); }

//Provides: MIX
//Requires: caml_mul, ROTL32
function MIX(h,d) {
  d = caml_mul(d, 0xcc9e2d51);
  d = ROTL32(d, 15);
  d = caml_mul(d, 0x1b873593);
  h ^= d;
  h = ROTL32(h, 13);
  return ((((h * 5)|0) + 0xe6546b64)|0);
}

//Provides: FINAL_MIX
//Requires: caml_mul
function FINAL_MIX(h) {
  h ^= h >>> 16;
  h = caml_mul (h, 0x85ebca6b);
  h ^= h >>> 13;
  h = caml_mul (h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h;
}

//Provides: caml_hash_mix_string_str
//Requires: MIX
function caml_hash_mix_string_str(h, s) {
  var len = s.length, i, w;
  for (i = 0; i + 4 <= len; i += 4) {
    w = s.charCodeAt(i)
      | (s.charCodeAt(i+1) << 8)
      | (s.charCodeAt(i+2) << 16)
      | (s.charCodeAt(i+3) << 24);
    h = MIX(h, w);
  }
  w = 0;
  switch (len & 3) {
  case 3: w  = s.charCodeAt(i+2) << 16;
  case 2: w |= s.charCodeAt(i+1) << 8;
  case 1: w |= s.charCodeAt(i);
    h = MIX(h, w);
  default:
  }
  h ^= len;
  return h;
}

// End: copy from js_of_ocaml
////////////////////////////////////////////////////////////////////////////////

//Provides: caml_hash_string
//Requires: caml_bytes_of_string, caml_hash_mix_string_str, FINAL_MIX
function caml_hash_string(s) {
  var h = caml_hash_mix_string_str(0, caml_bytes_of_string(s));
  h = FINAL_MIX(h)
  return h & 0x3FFFFFFF;
}
