import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'
import type { TeXOptions, SvgOptions } from 'node-tikzjax';

import { visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
import tex2svg from 'node-tikzjax';

const renderTikz = tex2svg.default;

interface TikzBlock extends Element{
  tagName: 'pre';
  children: [
    {
      type: 'element';
      tagName: 'code';
      properties: {
        className: ['language-tikz', ...any[]];
      }
      children: [
        {
          type: 'text';
          value: string;
        }
      ]
    }
  ]
}

function isTikzBlock(node:Element): node is TikzBlock {
  return (
    node.tagName === 'pre' && 
    node.children?.length === 1 && 
    node.children[0].type === 'element' &&
    node.children[0]?.tagName === 'code' &&
    node.children[0].properties?.className?.includes('language-tikz') &&
    node.children[0].children[0].type === 'text'
  ) === true;
}

const RehypeTikzjax: Plugin<[(TeXOptions & SvgOptions)?], Root> = (options = {}) => {
  return async (tree) => {

    const nodesToConvert:TikzBlock[] = [];

    visit(tree, 'element', (node) => {
      if (isTikzBlock(node)) {
        nodesToConvert.push(node);
      }
    });

    for(const node of nodesToConvert) {
      const tikzsrc = node.children[0].children[0].value;
      const svg = await renderTikz(tikzsrc, options);
      const svgHast = fromHtml(svg, {fragment: true});
      Object.assign(node, svgHast.children[0]);
    }

  }
}

export default RehypeTikzjax