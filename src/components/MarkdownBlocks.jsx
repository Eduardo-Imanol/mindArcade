import React from 'react';

function InlineNodes({ nodes }) {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((node, index) => {
    if (!node) return null;
    if (node.type === 'strong') {
      return (
        <strong key={index}>
          <InlineNodes nodes={node.children} />
        </strong>
      );
    }
    if (node.type === 'em') {
      return (
        <em key={index}>
          <InlineNodes nodes={node.children} />
        </em>
      );
    }
    if (node.type === 'code') {
      return (
        <code className="md-inline-code" key={index}>
          {node.value}
        </code>
      );
    }
    if (node.type === 'link') {
      if (!node.href) {
        return (
          <span className="md-link md-link--blocked" key={index}>
            <InlineNodes nodes={node.children} />
            {node.rawHref ? ` (${node.rawHref})` : ''}
          </span>
        );
      }
      const external = /^https?:\/\//i.test(node.href);
      return (
        <a
          className="md-link"
          href={node.href}
          key={index}
          rel={external ? 'noopener noreferrer' : undefined}
          target={external ? '_blank' : undefined}
        >
          <InlineNodes nodes={node.children} />
        </a>
      );
    }
    return <React.Fragment key={index}>{node.value || ''}</React.Fragment>;
  });
}

function Heading({ block }) {
  const level = Math.min(6, Math.max(1, Number(block.level) || 1));
  return React.createElement(
    `h${level}`,
    { className: `md-heading md-heading--${level}` },
    <InlineNodes nodes={block.inline} />
  );
}

function Block({ block }) {
  if (block.type === 'heading') return <Heading block={block} />;
  if (block.type === 'paragraph') {
    return (
      <p className="md-paragraph">
        <InlineNodes nodes={block.inline} />
      </p>
    );
  }
  if (block.type === 'list') {
    const Tag = block.ordered ? 'ol' : 'ul';
    return (
      <Tag className={`md-list ${block.ordered ? 'md-list--ordered' : 'md-list--unordered'}`}>
        {(block.items || []).map((item, index) => (
          <li key={index}>
            <InlineNodes nodes={item.inline} />
          </li>
        ))}
      </Tag>
    );
  }
  if (block.type === 'code') {
    return (
      <pre className="md-pre">
        <code className={`md-code${block.language ? ` language-${block.language}` : ''}`}>
          {block.code || ''}
        </code>
      </pre>
    );
  }
  if (block.type === 'blockquote') {
    return (
      <blockquote className="md-quote">
        <InlineNodes nodes={block.inline} />
      </blockquote>
    );
  }
  if (block.type === 'hr') return <hr className="md-hr" />;
  return null;
}

export default function MarkdownBlocks({ blocks, className = '' }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div className={`markdown-blocks ${className}`.trim()}>
      {blocks.map((block, index) => (
        <Block block={block} key={index} />
      ))}
    </div>
  );
}
