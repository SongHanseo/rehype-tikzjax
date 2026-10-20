import type { Plugin } from 'unified'
import type { Root, Element, Parent } from 'hast'
import type { TeXOptions, SvgOptions } from 'node-tikzjax';

import { visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
import tex2svg from 'node-tikzjax';

export interface RehypeTikzjaxOptions extends TeXOptions, SvgOptions {
  className?: string;
  removeBlankLines?: boolean;
  onError? : 'skip' | 'throw';
}

const renderTikz = tex2svg.default || tex2svg;

let processing = Promise.resolve();

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

interface TargetNode {
  node: TikzBlock;
  index: number;
  parent: Parent;
}

const RehypeTikzjax: Plugin<[RehypeTikzjaxOptions?], Root> = (options = {}) => {

  const {
    className = 'tikz-diagram',
    removeBlankLines = true,
    onError = 'skip',
    ...tikzOptions
  } = options;

  return async (tree) => {

    const nodesToConvert:TargetNode[] = [];

    visit(tree, 'element', (node, index, parent) => {
      if (isTikzBlock(node) && index !== undefined && parent) {
        nodesToConvert.push({ node, index, parent });
      }
    });

    for (const target of nodesToConvert) {
      const { node, index, parent } = target;
      let tikzsrc = node.children[0].children[0].value

      if (removeBlankLines) tikzsrc = tikzsrc.replace(/\n\s*\n/g, '\n');

      await new Promise<void>((resolve, reject) => {
        processing = processing.then(async () => {
          try {
            const svg = await renderTikz(tikzsrc, tikzOptions);
            const svgHast = fromHtml(svg, { fragment: true });
            const svgNode = svgHast.children[0] as Element;

            if (className) {
              svgNode.properties = svgNode.properties || {};
              svgNode.properties.className = [
                ...(Array.isArray(svgNode.properties.className) ? svgNode.properties.className : []),
                className
              ];
            }

            parent.children[index] = svgNode;
            resolve();
            
          } catch (err) {
            if (onError == 'throw') {
              reject(err);
            }
            else {
              console.error(err);
              resolve();
            }
          }
        });
      })
    }
  }
}

export default RehypeTikzjax