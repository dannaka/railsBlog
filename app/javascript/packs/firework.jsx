import {
  glMatrix,
  vec2, vec3, vec4,
  mat2, mat3, mat4,
  mat2d, quat
} from "gl-matrix";

  class renderSetting {
    constructor(members) {
      this.vertex_shader = members['vertex_shader'];
      this.fragment_shader = members['fragment_shader'];
      this.program = members['program'];
      this.attribute_stride = members['attribute_stride'];
      this.attribute_location = members['attribute_location'];
      this.uniform_location = members['uniform_location'];
      this.frame_buffer = members['frame_buffer'];
      this.depth_buffer = members['depth_buffer'];
      this.texture = members['texture'];
      this.width = members['width'];
      this.height = members['height'];
      this.stride_offset_byte = members['stride_offset_byte'];
    }

    get vertex_shader() {
      return this._vertex_shader;
    }
    set vertex_shader(vertex_shader) {
      this._vertex_shader = vertex_shader;
    }
    get fragment_shader() {
      return this._fragment_shader;
    }
    set fragment_shader(fragment_shader) {
      this._fragment_shader = fragment_shader;
    }
    get program() {
      return this._program;
    }
    set program(program) {
      this._program = program;
    }
    get attribute_stride() {
      return this._attribute_stride;
    }
    set attribute_stride(attribute_stride) {
      this._attribute_stride = attribute_stride;
    }
    get attribute_location() {
      return this._attribute_location;
    }
    set attribute_location(attribute_location) {
      this._attribute_location = attribute_location;
    }
    get uniform_location() {
      return this._uniform_location;
    }
    set uniform_location(uniform_location) {
      this._uniform_location = uniform_location;
    }
    get frame_buffer() {
      return this._frame_buffer;
    }
    set frame_buffer(frame_buffer) {
      this._frame_buffer = frame_buffer;
    }
    get depth_buffer() {
      return this._depth_buffer;
    }
    set depth_buffer(depth_buffer) {
      this._depth_buffer = depth_buffer;
    }
    get texture() {
      return this._texture;
    }
    set texture(texture) {
      this._texture = texture;
    }
    get width() {
      return this._width;
    }
    set width(width) {
      this._width = width;
    }
    get height() {
      return this._height;
    }
    set height(height) {
      this._height = height;
    }
    get stride_offset_byte() {
      return this._stride_offset_byte;
    }
    set stride_offset_byte(stride_offset_byte) {
      this._stride_offset_byte = stride_offset_byte;
    }

    useProgram() {
      gl.useProgram(this.program);
    }

    resizeBuffers(newW, newH) {
      this.frame_buffer = undefined;
      this.depth_buffer = undefined;
      this.texture = undefined;
      var newBuffers = create_framebuffer(newW, newH);
      this.frame_buffer = newBuffers['frame_buffer'];
      this.depth_buffer = newBuffers['depth_buffer'];
      this.texture = newBuffers['texture'];
    }
  }

  const FLOAT_BYTE_BITS = 2;

  var cv, gl;
  var texture;
  var settings = [];
  var rawSetting = null;
  var gaussianBlurSetting = null;

  var m = mat4.create();
  var v = mat4.create();
  var p = mat4.create();
  var mvp = mat4.create();
  var tmp = mat4.create();
  var inv = mat4.create();
  var vp = mat4.create();
  var translation = vec3.create();

	// 正射影用の座標変換行列
  var orthogonalV = mat4.create();
  var orthogonalP = mat4.create();
  var orthogonalVP = mat4.create();
  mat4.lookAt(
    orthogonalV,
    vec3.fromValues(0.0, 0.0, 0.5),
    vec3.fromValues(0.0, 0.0, 0.0),
    vec3.fromValues(0.0, 1.0, 0.0)
  );
  mat4.ortho(orthogonalP, -1.0, 1.0, 1.0, -1.0, 0.1, 1);
  mat4.multiply(orthogonalVP, orthogonalP, orthogonalV);

  function resize(canvas) {
    var resized = false;
    var displayWidth  = document.body.clientWidth;
    var displayHeight = document.body.clientHeight;

    var canvasLength = 1;
    for (let i = 0, lengthUpperBound = Math.min(displayWidth, displayHeight); canvasLength < lengthUpperBound; ++i) {
      canvasLength = 1 << i;
    }
    canvasLength >> 1;

    if (canvas.width  != canvasLength
        || canvas.height != canvasLength)
    {
      resized = true;
      canvas.width  = canvasLength;
      canvas.height = canvasLength;

      gl.viewport(0, 0, canvas.width, canvas.height);

      for(let i = 0; i < settings.length; ++i) {
        settings[i].resizeBuffers(canvas.width, canvas.height);
      }
      settings = [];
      let strideOffsetByteRaw = rawSetting.stride_offset_byte;
      rawSetting = getRawRenderSetting(cv.width, cv.height);
      rawSetting.stride_offset_byte = strideOffsetByteRaw;
      // var foggedSetting = getFoggedSetting(cv.width, cv.height);

      let strideOffsetByteGaussian = gaussianBlurSetting.stride_offset_byte;
      gaussianBlurSetting = getGaussianBlurSetting(cv.width, cv.height);
      gaussianBlurSetting.stride_offset_byte = strideOffsetByteGaussian;

      settings.push(rawSetting);
      settings.push(gaussianBlurSetting);
    }
    return resized;
  }

  var resizeTimer = false;
  var resizeInterval = Math.floor(1000 / 60 * 10);

  document.body.onresize(function (event) {
    console.log('resized');
    if (resizeTimer !== false) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(function () {
      resize(cv);
    }, resizeInterval);
  });

  function create_shader(id){
    // シェーダを格納する変数
    var shader;
    // HTMLからscriptタグへの参照を取得
    var scriptElement = document.getElementById(id);
    // scriptタグが存在しない場合は抜ける
    if(!scriptElement){return;}

    // scriptタグのtype属性をチェック
    switch(scriptElement.type){
      // 頂点シェーダの場合
      case 'x-shader/x-vertex':
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;
      // フラグメントシェーダの場合
      case 'x-shader/x-fragment':
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;
      default :
      return;
    }

    // 生成されたシェーダにソースを割り当てる
    gl.shaderSource(shader, scriptElement.text);

    // シェーダをコンパイルする
    gl.compileShader(shader);

    // シェーダが正しくコンパイルされたかチェック
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      // 成功していたらシェーダを返して終了
      return shader;
    }else{
      // 失敗していたらエラーログをアラートする
      alert(gl.getShaderInfoLog(shader));
    }
  }

  function create_program(vs, fs){
    // プログラムオブジェクトの生成
    var program = gl.createProgram();

    // プログラムオブジェクトにシェーダを割り当てる
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    // シェーダをリンク
    gl.linkProgram(program);

    // シェーダのリンクが正しく行なわれたかチェック
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
      // 成功していたらプログラムオブジェクトを有効にする
      gl.useProgram(program);
      // プログラムオブジェクトを返して終了
      return program;
    }else{
      // 失敗していたらエラーログをアラートする
      alert(gl.getProgramInfoLog(program));
    }
  }

  function create_vbo(data){
    // バッファオブジェクトの生成
    var vbo = gl.createBuffer();

    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // バッファにデータをセット
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    // バッファのバインドを無効化
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // 生成した VBO を返して終了
    return vbo;
  }

  function create_ibo(data){
    // バッファオブジェクトの生成
    var ibo = gl.createBuffer();

    // バッファをバインドする
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    // バッファにデータをセット
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

    // バッファのバインドを無効化
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // 生成したIBOを返して終了
    return ibo;
  }

  function create_texture(source){
    // イメージオブジェクトの生成
    var img = new Image();

    // データのオンロードをトリガーにする
    img.onload = function(){
      // テクスチャオブジェクトの生成
      var tex = gl.createTexture();

      // テクスチャをバインドする
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // テクスチャへイメージを適用
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      // ミップマップを生成
      gl.generateMipmap(gl.TEXTURE_2D);

      // テクスチャのバインドを無効化
      gl.bindTexture(gl.TEXTURE_2D, null);

      // 生成したテクスチャをグローバル変数に代入
      texture = tex;
    };

    // イメージオブジェクトのソースを指定
    img.src = source;
  }

  // フレームバッファをオブジェクトとして生成する関数
  function create_framebuffer(width, height){
    // フレームバッファの生成
    var frameBuffer = gl.createFramebuffer();

    // フレームバッファをWebGLにバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    // 深度バッファ用レンダーバッファの生成とバインド
    var depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);

    // レンダーバッファを深度バッファとして設定
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    // フレームバッファにレンダーバッファを関連付ける
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

    // フレームバッファ用テクスチャの生成
    var fTexture = gl.createTexture();

    // フレームバッファ用のテクスチャをバインド
    gl.bindTexture(gl.TEXTURE_2D, fTexture);

    // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // テクスチャパラメータ
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // フレームバッファにテクスチャを関連付ける
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

    // 各種オブジェクトのバインドを解除
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // オブジェクトを返して終了
    return {
      frame_buffer : frameBuffer,
      depth_buffer : depthRenderBuffer,
      texture : fTexture,
      width: width,
      height: height,
    };
  }

  // setting を参照しながら interleaved VBOの attribute を登録していく
  function setAttributes(setting) {
    let attStrideSum = 0;
    for (let key in setting.attribute_stride) {
      attStrideSum += setting.attribute_stride[key];
    }
    const vertexBits = attStrideSum << FLOAT_BYTE_BITS;

    let strideOffsetBytes = 0;
    for (let key in setting.attribute_location) {
      // attribute属性を有効にする
      gl.enableVertexAttribArray(setting.attribute_location[key]);

      // attribute属性を登録
      gl.vertexAttribPointer(
        setting.attribute_location[key],
        setting.attribute_stride[key],
        gl.FLOAT,
        false,
        vertexBits,
        setting.stride_offset_byte[key]
      );

      strideOffsetBytes += (setting.attribute_stride[key] << FLOAT_BYTE_BITS);
    }
  }

  function getInterleavedModelVBO(modelData, setting) {
    let vertexCnt = -1;
    for (let key in modelData['vertex_info']) {
      vertexCnt = modelData['vertex_info'][key].length / setting.attribute_stride[key];
      if(vertexCnt >= 0) {
        break;
      }
    }
    let strideOffsetByte = {};
    let strideOffsetByteSum = 0;
    for(let key in setting.attribute_stride) {
      strideOffsetByte[key] = strideOffsetByteSum;
      strideOffsetByteSum += (setting.attribute_stride[key] << FLOAT_BYTE_BITS);
    }

    var vertex_info = [];
    for(let v = 0; v < vertexCnt; ++v){
      for(let key in setting.attribute_stride) {
        for(let i = 0; i < setting.attribute_stride[key]; ++i){
          vertex_info.push(modelData['vertex_info'][key][v * setting.attribute_stride[key] + i]);
        }
      }
    }

    return  [create_vbo(vertex_info), strideOffsetByte];
  }

  // プレーンな板ポリゴン生成
  function squarePlainPolygon() {
    var pos = [
      -1.0,  1.0,  0.0,
      1.0,  1.0,  0.0,
      -1.0, -1.0,  0.0,
      1.0, -1.0,  0.0
    ];
    var texCoord = [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0
    ];
    var idx = [
      0, 2, 1,
      2, 3, 1
    ];

    return {
      vertex_info: {
        position: pos,
        texture_coordinate: texCoord,
      },
      index: idx,
    };
  }

  // 球体を生成する関数
  function sphere(row, column, rad, color){
    var pos = new Array(), nor = new Array(),
        col = new Array(), idx = new Array();
    for(var i = 0; i <= row; i++){
      var r = Math.PI / row * i;
      var ry = Math.cos(r);
      var rr = Math.sin(r);
      for(var ii = 0; ii <= column; ii++){
        var tr = Math.PI * 2 / column * ii;
        var tx = rr * rad * Math.cos(tr);
        var ty = ry * rad;
        var tz = rr * rad * Math.sin(tr);
        var rx = rr * Math.cos(tr);
        var rz = rr * Math.sin(tr);
        if(color){
          var tc = color;
        }else{
          tc = hsva(360 / row * i, 1, 1, 1);
        }
        pos.push(tx, ty, tz);
        nor.push(rx, ry, rz);
        col.push(tc[0], tc[1], tc[2], tc[3]);
      }
    }
    r = 0;
    for(i = 0; i < row; i++){
      for(ii = 0; ii < column; ii++){
        r = (column + 1) * i + ii;
        idx.push(r, r + 1, r + column + 2);
        idx.push(r, r + column + 2, r + column + 1);
      }
    }
    return {
      vertex_info: {
        position: pos,
        normal: nor,
        color: col,
      },
      index : idx,
    };
  }
  function torus(row, column, irad, orad){
    var pos = new Array(), nor = new Array(),
        col = new Array(), idx = new Array();
    for(var i = 0; i <= row; i++){
      var r = Math.PI * 2 / row * i;
      var rr = Math.cos(r);
      var ry = Math.sin(r);
      for(var ii = 0; ii <= column; ii++){
        var tr = Math.PI * 2 / column * ii;
        var tx = (rr * irad + orad) * Math.cos(tr);
        var ty = ry * irad;
        var tz = (rr * irad + orad) * Math.sin(tr);
        var rx = rr * Math.cos(tr);
        var rz = rr * Math.sin(tr);
        pos.push(tx, ty, tz);
        nor.push(rx, ry, rz);
        var tc = hsva(360 / column * ii, 1, 1, 1);
        col.push(tc[0], tc[1], tc[2], tc[3]);
      }
    }
    for(i = 0; i < row; i++){
      for(ii = 0; ii < column; ii++){
        r = (column + 1) * i + ii;
        idx.push(r, r + column + 1, r + 1);
        idx.push(r + column + 1, r + column + 2, r + 1);
      }
    }
    return {
      vertex_info: {
        position: pos,
        normal: nor,
        color: col,
      },
      index: idx,
    };
  }

  function hsva(h, s, v, a){
    if(s > 1 || v > 1 || a > 1){return;}
    var th = h % 360;
    var i = Math.floor(th / 60);
    var f = th / 60 - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var color = new Array();
    if(!s > 0 && !s < 0){
      color.push(v, v, v, a);
    } else {
      var r = new Array(v, n, m, m, k, v);
      var g = new Array(k, v, v, n, m, m);
      var b = new Array(m, m, k, v, v, n);
      color.push(r[i], g[i], b[i], a);
    }
    return color;
  }

  function getGaussianWeight(dispersionSeed) {
    // gaussianフィルタの重み係数を算出
    var weight = new Array(10);
    var t = 0.0;
    var d = dispersionSeed * dispersionSeed / 100;
    for(let i = 0; i < weight.length; i++){
      var r = 1.0 + 2.0 * i;
      var w = Math.exp(-0.5 * (r * r) / d);
      weight[i] = w;
      if(i > 0){w *= 2.0;}
      t += w;
    }
    for(let i = 0; i < weight.length; i++){
      weight[i] /= t;
    }
    return weight;
  }

  function gaussianRender(setting, sourceTexture, dispersionSeed) {
    setting.useProgram();
    var polygon_info = squarePlainPolygon();

    var [polygonVBO, strideOffsetByte] = getInterleavedModelVBO(polygon_info, setting);
    setting.stride_offset_byte = strideOffsetByte;

    var index = create_ibo(polygon_info['index']);

    // VBOをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, polygonVBO);

    // バッファを初期化
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    // 板ポリゴンのレンダリング
    setAttributes(setting);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    // テクスチャの適用
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);

    let uniLocation = setting.uniform_location;

    gl.uniformMatrix4fv(uniLocation['mvpMatrix'], false, orthogonalVP);
    gl.uniform1i(uniLocation['texture'], 0);
    gl.uniform1fv(uniLocation['weight'], getGaussianWeight(dispersionSeed));
    gl.uniform1f(uniLocation['textureWidth'], setting.width);
    gl.uniform1f(uniLocation['textureHeight'], setting.height);
    var isHorizontal = false;
    do {
      gl.uniform1i(uniLocation['isHorizontal'], isHorizontal);

      if(!isHorizontal) {
        // フレームバッファのバインドを変更
        gl.bindFramebuffer(gl.FRAMEBUFFER, setting.frame_buffer);
        // テクスチャを変更
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
      } else {
        // フレームバッファのバインド解除
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);


      isHorizontal = !isHorizontal;
    } while(isHorizontal);
  }


  function getRawRenderSetting(width, height) {
    var v_shader = create_shader("vs");
    var f_shader = create_shader("fs");
    var program = create_program(v_shader, f_shader);

    // attributeLocationの取得
    var attLocation = {
      position: gl.getAttribLocation(program, 'position'),
      normal: gl.getAttribLocation(program, 'normal'),
      color: gl.getAttribLocation(program, 'color'),
    };

    // attribute position１つが持つ情報数(この場合は xyz の3つ)
    var attStride = {
      position: 3,
      normal: 3,
      color: 4,
    };

    // uniformLocationの取得
    var uniLocation = {
      'mvpMatrix': gl.getUniformLocation(program, 'mvpMatrix'),
      'invMatrix': gl.getUniformLocation(program, 'invMatrix'),
      'lightDirection': gl.getUniformLocation(program, 'lightDirection'),
      'ambientColor': gl.getUniformLocation(program, 'ambientColor'),
      'pointSize': gl.getUniformLocation(program, 'pointSize'),
    };

    var buffers = create_framebuffer(width, height);

    return new renderSetting({
      vertex_shader: v_shader,
      fragment_shader: f_shader,
      program: program,
      attribute_stride: attStride,
      attribute_location: attLocation,
      uniform_location: uniLocation,
      frame_buffer: buffers['frame_buffer'],
      depth_buffer: buffers['depth_buffer'],
      texture: buffers['texture'],
      width: buffers['width'],
      height: buffers['height'],
    });
  }

  function getFoggedSetting(width, height) {
    var v_shader = create_shader('fogged-vs');
    var f_shader = create_shader('fogged-fs');
    var program = create_program(v_shader, f_shader);

  }

  function getGaussianBlurSetting(width, height) {
    // 正射影で板ポリゴンをレンダリングするシェーダ
    var v_shader = create_shader('gaussian-vs');
    var f_shader = create_shader('gaussian-fs');
    var program = create_program(v_shader, f_shader);
    var attLocation = {
      position: gl.getAttribLocation(program, 'position'),
      texture_coordinate: gl.getAttribLocation(program, 'texCoord'),
    };

    var attStride = {
      position: 3,
      texture_coordinate: 2,
    };
    var uniLocation = {
      mvpMatrix: gl.getUniformLocation(program, 'mvpMatrix'),
      texture: gl.getUniformLocation(program, 'texture'),
      gaussian: gl.getUniformLocation(program, 'gaussian'),
      weight: gl.getUniformLocation(program, 'weight'),
      horizontal: gl.getUniformLocation(program, 'horizontal'),
      textureWidth: gl.getUniformLocation(program, 'textureWidth'),
      textureHeight: gl.getUniformLocation(program, 'textureHeight'),
    };

    var buffers = create_framebuffer(width, height);

    return new renderSetting({
      vertex_shader: v_shader,
      fragment_shader:  f_shader,
      program: program,
      attribute_location: attLocation,
      attribute_stride: attStride,
      uniform_location: uniLocation,
      frame_buffer: buffers['frame_buffer'],
      depth_buffer: buffers['depth_buffer'],
      texture: buffers['texture'],
      width: buffers['width'],
      height: buffers['height'],
    });
  }

  function rawRender(setting, torusVBO, torusIndices, loopCnt){
    setting.useProgram();

    // フレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, setting.frame_buffer);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // VBOをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, torusVBO);

    setAttributes(setting);

    // mat4.create returns identity mat.
    var lightDirection = vec3.fromValues(0.5, -0.5, -0.5);
    const startingEyePosition = vec3.fromValues(0.0, -10.0, 20.0);
    const startingEyeUpDirection = vec3.fromValues(0.0, 1.0, 0.0);
    var eyePosition = startingEyePosition;
    var eyeUpDirection = startingEyeUpDirection;
    var ambientColor = vec4.fromValues(0.1, 0.1, 0.1, 1.0);
    var eyeQuat = quat.create();
    var pointSize = 0.1;

    // view transform
    mat4.lookAt(
      v,
      eyePosition,
      vec3.fromValues(0, 0, 0),
      eyeUpDirection,
    );

    // projection transform
    mat4.perspective(p, glMatrix.toRadian(90), cv.clientWidth / cv.clientHeight, 0.1, 100);

    mat4.mul(vp, p, v);


    gl.uniform3fv(setting.uniform_location['lightDirection'], lightDirection);
    gl.uniform3fv(setting.uniform_location['eyePosition'], eyePosition);
    gl.uniform4fv(setting.uniform_location['ambientColor'], ambientColor);
    gl.uniform1f(setting.uniform_location['pointSize'], pointSize);

    var ibo = create_ibo(torusIndices);

    // IBOをバインドして登録する
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    let rad = glMatrix.toRadian(loopCnt % 360);
    let eyeRad = glMatrix.toRadian((loopCnt << 1 ) % 360);
    eyeRad = 0;

    // クォータニオンによる回転
    quat.setAxisAngle(eyeQuat, vec3.fromValues(1, 0, 0), eyeRad);
    vec3.transformQuat(eyePosition, startingEyePosition, eyeQuat)
    vec3.transformQuat(eyeUpDirection, startingEyeUpDirection, eyeQuat)

    // ビュー×プロジェクション座標変換行列
    mat4.lookAt(
      v,
      eyePosition,
      vec3.fromValues(0, 0, 0),
      eyeUpDirection,
    );
    mat4.mul(vp, p, v);

    var x = Math.cos(rad);
    var y = Math.sin(rad);

    /////////////////////
    // model transform
    mat4.identity(m);
    vec3.set(translation, x, y + 1.0, 0.0);
    mat4.translate(m, m, translation);
    mat4.mul(mvp, vp, m);
    mat4.invert(inv, mvp);

    // uniformLocationへ座標変換行列を登録
    gl.uniformMatrix4fv(setting.uniform_location['mvpMatrix'], false, mvp);
    gl.uniformMatrix4fv(setting.uniform_location['invMatrix'], false, inv);
    // モデルの描画
    //gl.drawArrays(gl.TRIANGLES, 0, 3);
    //gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.POINTS, torusIndices.length, gl.UNSIGNED_SHORT, 0);
    //////////////////////


    //////////////////////
    // model transform
    mat4.identity(m);
    vec3.set(translation, 1.0, -1.0, 0.0);
    mat4.translate(m, m, translation);
    mat4.rotate(m, m, rad, vec3.fromValues(0, 1, 1));
    mat4.mul(mvp, vp, m);
    mat4.invert(inv, mvp);

    // uniformLocationへ座標変換行列を登録
    gl.uniformMatrix4fv(setting.uniform_location['mvpMatrix'], false, mvp);
    gl.uniformMatrix4fv(setting.uniform_location['invMatrix'], false, inv);
    // モデルの描画
    //gl.drawArrays(gl.TRIANGLES, 0, 3);
    //gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.POINTS, torusIndices.length, gl.UNSIGNED_SHORT, 0);
    //////////////////////


    //////////////////////
    // model transform
    mat4.identity(m);
    vec3.set(translation, -1.0, -1.0, 0.0);
    mat4.translate(m, m, translation);
    mat4.rotate(m, m, rad, vec3.fromValues(1, 0, 0));
    var scale = Math.sin(rad) + 1.0;
    mat4.scale(m, m, vec3.fromValues(scale, scale, scale));
    mat4.mul(mvp, vp, m);
    mat4.invert(inv, mvp);

    // uniformLocationへ座標変換行列を登録
    gl.uniformMatrix4fv(setting.uniform_location['mvpMatrix'], false, mvp);
    gl.uniformMatrix4fv(setting.uniform_location['invMatrix'], false, inv);
    // モデルの描画
    //gl.drawArrays(gl.TRIANGLES, 0, 3);
    //gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.POINTS, torusIndices.length, gl.UNSIGNED_SHORT, 0);
  }

  window.onload = function() {
    cv = document.getElementById('canvas');
    gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');

    const torusRowCnt = 1 << 8;
    const torusColCnt = 1 << 8;

    settings = [];
    rawSetting = getRawRenderSetting(cv.width, cv.height);
    // var foggedSetting = getFoggedSetting(cv.width, cv.height);
    gaussianBlurSetting = getGaussianBlurSetting(cv.width, cv.height);

//    var torus_info = torus(torusRowCnt, torusColCnt, 0.4, 1);
    var torus_info = sphere(torusRowCnt, torusColCnt, 1, null);
    var [torusVBO, strideOffsetByte] = getInterleavedModelVBO(torus_info, rawSetting);
    rawSetting.stride_offset_byte = strideOffsetByte;

    settings.push(rawSetting);
    settings.push(gaussianBlurSetting);


    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);

    // 深度テストの比較方法指定
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    var loopCnt = 0;
    // webGlの行列計算は列オーダーなのでmodelに対する操作は,移動->回転->拡大縮小の順
    function drawLoop(){
      loopCnt++;

      rawRender(rawSetting, torusVBO, torus_info['index'], loopCnt);
      gaussianRender(gaussianBlurSetting, rawSetting.texture, 5.0);

      // コンテキストの再描画
      gl.flush();

      requestAnimationFrame(drawLoop);
    }
    drawLoop();






















  }
