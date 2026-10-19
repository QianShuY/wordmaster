# 墨词战斗配乐音色署名

《雾桥之誓》的旋律、编配和互动混音为墨词项目原创；Les Apollo 的《M3》仅作为用户提供的风格参考，未使用其录音、旋律转录或 MIDI。

本版本吉他与电贝斯使用 **FluidR3 GM** 的 overdriven guitar、clean electric guitar、picked electric bass 音色，经 **Benjamin Gleitzman / MIDI.js Soundfonts** 项目提供的 MP3 单音采样转换、裁切、重采样、包络及混音处理。

- 采样来源与作者项目：https://github.com/gleitz/midi-js-soundfonts
- 音色说明及授权：https://github.com/gleitz/midi-js-soundfonts/blob/gh-pages/README.md
- FluidR3 音色授权：Creative Commons Attribution 3.0，https://creativecommons.org/licenses/by/3.0/
- MIDI.js Soundfonts 转换工具版权：Copyright (C) 2012 Benjamin Gleitzman；MIT 许可，https://github.com/gleitz/midi-js-soundfonts/blob/gh-pages/LICENSE.txt

保留来源与变更说明不表示原作者为本项目背书。采样来源、输入文件 SHA-256、每个转换后 WAV 的 SHA-256 见 `scripts/audio-samples/fluidr3/manifest.json`。运行时使用已经渲染好的音乐文件，无需联网加载这些音色。

鼓组、电子脉冲、合成器与弦乐为本地程序合成，无第三方录音采样。

`impact-*-v1.wav` 七份打击音效由 `scripts/render-boss-impacts.js` 原创合成，包括噪声滤波、非谐振动、短空间反射和碎裂层次，无第三方录音采样。
