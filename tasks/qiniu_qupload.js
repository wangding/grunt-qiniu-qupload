/*
 * grunt-qiniu-upload
 * https://github.com/wangding/grunt-qiniu-upload
 *
 * Copyright (c) 2020 wangding
 * Licensed under the MIT license.
 */

'use strict';

let fs    = require('fs'),
    path  = require('path'),
    qiniu = require('qiniu');

function uploadFile(localFile, prefix, options) {
  let uptoken = (new qiniu.rs.PutPolicy(options.bucket)).token(),
      key     = prefix + path.basename(localFile),
      extra   = new qiniu.io.PutExtra(),
      client  = new qiniu.rs.Client();

  client.remove(options.bucket, key, (err, ret) => {
    (!err) && console.log('Delete old file success! >>> ', key);
    (err)  && console.log('Delete old file error! >>> ', key, err);

    qiniu.io.putFile(uptoken, key, localFile, extra, (err, ret) => {
      (!err) && console.log('upload success! >>> ', ret.key);
      (err)  && console.log(err);
    });
  });
}

function uploadFileOrDir(grunt, filePath, prefix, skip, options) {
  if (grunt.file.exists(filePath)) {
    if (grunt.file.isFile(filePath)) {
      uploadFile(filePath, prefix, options);
    } else if (grunt.file.isDir(filePath)) {
      grunt.file.recurse(filePath, (abspath, rootdir, subdir, filename) => {
        if (skip && skip.indexOf(filename) > -1) {} else {
          if(typeof subdir !== 'undefined' && prefix === '')  prefix += subdir + '/';
          uploadFile(abspath, prefix, options);
          prefix = '';
        }
      });
    } else {
      console.error('[ERROR] >>> ', filePath, 'is not a file or directory!');
    }
  } else {
    console.error('[ERROR] >>> ', filePath, 'is not exists!');
  }
}

module.exports = function(grunt) {
  grunt.registerMultiTask('qiniu_qupload', 'a grunt plugin which can upload assets to qiniu.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    let options = this.options({
      cwd: '.',
      ak: null,
      sk: null,
      bucket: null,
      assets: null
    });

    // qiniu.io is async
    this.async();

    if(options && options.ak && options.sk) {
      qiniu.conf.ACCESS_KEY = process.env[options.ak];
      qiniu.conf.SECRET_KEY = process.env[options.sk];

      if(options.cwd && options.bucket && options.assets && Array.isArray(options.assets)) {
        for(let i = options.assets.length - 1; i >= 0; i--) {
          uploadFileOrDir(grunt, path.resolve(options.cwd, options.assets[i].src), options.assets[i].prefix, options.assets[i].skip, options);
        }
      }
    }
  });
};
