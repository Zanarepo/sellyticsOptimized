import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ShareholderModule() {
  const [shareholders, setShareholders] = useState([])
  const [newShareholder, setNewShareholder] = useState({
    shareholder_group: '',
    shareholder_name: '',
    ownership_percent: '',
    notes: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [showDoc, setShowDoc] = useState(true)

  // Fetch all shareholders
  async function fetchShareholders() {
    const { data, error } = await supabase.from('shareholders').select('*').order('id')
    if (!error) setShareholders(data || [])
  }

  useEffect(() => {
    fetchShareholders()
  }, [])

  // Calculate total ownership
  const totalPercent = shareholders.reduce((sum, s) => sum + parseFloat(s.ownership_percent || 0), 0)
  const remainingShares = (100 - totalPercent).toFixed(2)

  // Add or Update shareholder
  async function handleSubmit(e) {
    e.preventDefault()
    const percent = parseFloat(newShareholder.ownership_percent || 0)
    if (percent <= 0 || isNaN(percent)) {
      alert('Enter a valid % ownership')
      return
    }

    if (editingId) {
      // --- Update existing shareholder ---
      const { error } = await supabase
        .from('shareholders')
        .update(newShareholder)
        .eq('id', editingId)

      if (!error) {
        await handleRedistributionPrompt('update', percent, editingId)
        setEditingId(null)
        setNewShareholder({ shareholder_group: '', shareholder_name: '', ownership_percent: '', notes: '' })
        fetchShareholders()
      }
    } else {
      // --- Add New Shareholder ---
      if (percent >= 100) {
        alert('Cannot assign 100% or more to one shareholder.')
        return
      }

      const totalBeforeAdd = totalPercent
      if (totalBeforeAdd === 0) {
        // First shareholder — take all
        await supabase.from('shareholders').insert([newShareholder])
      } else {
        // Proportionally reduce all existing shareholders
        const totalAfterAdd = 100 - percent
        for (const s of shareholders) {
          const adjustedShare = (parseFloat(s.ownership_percent) / totalBeforeAdd) * totalAfterAdd
          await supabase.from('shareholders').update({ ownership_percent: adjustedShare.toFixed(2) }).eq('id', s.id)
        }
        // Add the new shareholder
        await supabase.from('shareholders').insert([newShareholder])
      }

      setNewShareholder({ shareholder_group: '', shareholder_name: '', ownership_percent: '', notes: '' })
      fetchShareholders()
    }
  }

  // Delete shareholder
  async function handleDelete(id, percent) {
    const confirm = window.confirm('Delete this shareholder?')
    if (!confirm) return

    const { error } = await supabase.from('shareholders').delete().eq('id', id)
    if (!error) {
      await handleRedistributionPrompt('delete', percent, id)
      fetchShareholders()
    }
  }

  // Redistribution logic for update/delete
  async function handleRedistributionPrompt(action, percentValue, excludeId) {
    const confirm = window.confirm(
      'Do you want to redistribute this percentage among remaining shareholders? (Cancel = Reserve it)'
    )
    if (!confirm) return

    const { data: current } = await supabase.from('shareholders').select('*').neq('id', excludeId)
    if (!current?.length) return

    const totalToAdd = parseFloat(percentValue)
    const totalExisting = current.reduce((sum, s) => sum + parseFloat(s.ownership_percent || 0), 0)

    for (const sh of current) {
      const newVal =
        (parseFloat(sh.ownership_percent) / totalExisting) * (totalExisting + totalToAdd)
      await supabase.from('shareholders').update({ ownership_percent: newVal.toFixed(2) }).eq('id', sh.id)
    }
  }

  // Edit a row
  function handleEdit(sh) {
    setEditingId(sh.id)
    setNewShareholder({
      shareholder_group: sh.shareholder_group,
      shareholder_name: sh.shareholder_name,
      ownership_percent: sh.ownership_percent,
      notes: sh.notes
    })
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 text-gray-800 p-8 space-y-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        📊 Sellytics Shareholding Management
      </h1>

      {/* ADD / UPDATE FORM */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-3 bg-white p-4 rounded-lg shadow-md w-full"
      >
        <input
          type="text"
          placeholder="Shareholder Group"
          value={newShareholder.shareholder_group}
          onChange={e =>
            setNewShareholder({ ...newShareholder, shareholder_group: e.target.value })
          }
          className="border p-2 rounded w-1/4"
        />
        <input
          type="text"
          placeholder="Name"
          value={newShareholder.shareholder_name}
          onChange={e =>
            setNewShareholder({ ...newShareholder, shareholder_name: e.target.value })
          }
          className="border p-2 rounded w-1/4"
        />
        <input
          type="number"
          step="0.01"
          placeholder="% Ownership"
          value={newShareholder.ownership_percent}
          onChange={e =>
            setNewShareholder({ ...newShareholder, ownership_percent: e.target.value })
          }
          className="border p-2 rounded w-1/6"
        />
        <input
          type="text"
          placeholder="Notes"
          value={newShareholder.notes}
          onChange={e => setNewShareholder({ ...newShareholder, notes: e.target.value })}
          className="border p-2 rounded w-1/4"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? 'Update' : 'Add Shareholder'}
        </button>
      </form>

      {/* SHAREHOLDER TABLE */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full border-collapse border border-gray-200 text-left">
          <thead className="bg-gray-100">
            <tr>
              {['Group', 'Name', '% Ownership', 'Notes', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 border border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shareholders.map(sh => (
              <tr key={sh.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{sh.shareholder_group}</td>
                <td className="px-4 py-2 border">{sh.shareholder_name}</td>
                <td className="px-4 py-2 border">
                  {parseFloat(sh.ownership_percent).toFixed(2)}%
                </td>
                <td className="px-4 py-2 border">{sh.notes || '-'}</td>
                <td className="px-4 py-2 border flex gap-2">
                  <button
                    onClick={() => handleEdit(sh)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sh.id, sh.ownership_percent)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-right font-semibold text-gray-700 flex justify-between">
          <span>Remaining Shares: {remainingShares}%</span>
          <span>Total Ownership: {totalPercent.toFixed(2)}%</span>
        </div>
      </div>

      {/* GOVERNANCE DOC */}
      <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-2">
            📑 Sellytics Shareholding & Governance Document
          </h2>
          <button
            onClick={() => setShowDoc(!showDoc)}
            className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            {showDoc ? 'Hide Document' : 'Show Document'}
          </button>
        </div>

        {showDoc && (
          <>
            <section>
              <h3 className="text-xl font-semibold mt-4">
                3. Governance & Decision-Making
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Board Structure: 3 seats initially (CEO, CTO, Investor Rep), can expand to
                  5 after seed funding (add CMO, Independent Advisor).
                </li>
                <li>
                  Voting Rights: Majority (51%+) required for key decisions. Founders retain
                  majority control.
                </li>
                <li>
                  Investor Rights: Quarterly updates and access to KPIs, financials, and
                  strategic plans.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mt-4">
                4. Vesting & Protection Clauses
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Founder Vesting: 4-year vesting with 1-year cliff.</li>
                <li>
                  Advisor/Investor Vesting: Milestone-based equity (e.g., 1.5% UK investor
                  on traction).
                </li>
                <li>Anti-Dilution: All shareholders protected by pro-rata rights.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mt-4">
                5. Rationale for Shareholding Split
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Founders maintain control and majority while rewarding early contributors.
                </li>
                <li>PMs incentivized for growth.</li>
                <li>Investors align capital with tangible outcomes.</li>
                <li>ESOP attracts top-tier talent.</li>
                <li>Future seed pool keeps cap table investor-friendly.</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
