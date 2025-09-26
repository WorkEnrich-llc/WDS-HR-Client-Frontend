import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-company-chart',
  imports: [CommonModule],
  templateUrl: './company-test-chart.component.html',
  styleUrl: './company-test-chart.component.css'
})
export class CompanyTestChartComponent implements AfterViewInit {
  // @ViewChild('iframeRef', { static: false }) iframeRef!: ElementRef;
  @ViewChild('chartBox') chartBox?: ElementRef;
  @ViewChild('orgChartFrame', { static: false }) orgChartFrame!: ElementRef<HTMLIFrameElement>;
  private iframeReady = false;


  chart: any;
  zoom = 1;
  isFullScreen = false;
  toggleState = true;

  orgChartData = [
    {
      id: 1,
      name: "Talent",
      number_employees: "1 - 50",
      firstNode: true,
      type: "company",
      expanded: false,
      children: [
        {
          id: 2,
          name: "Cairo",
          code: "T-OD-B-@-1",
          location: "Cairo",
          max_employee: 12,
          type: "branch",
          expanded: false,
          children: [
            {
              id: 3,
              name: "IT",
              code: "T-OD-D-@-2",
              type: "department",
              expanded: false,
              children: [
                {
                  id: 4,
                  name: "Mobile",
                  code: "1",
                  type: "section",
                  expanded: false,
                  children: [
                    {
                      id: 5,
                      name: "Mobile Engineer",
                      code: "T-OD-JT-@-1",
                      type: "job_title",
                      level: "Non-Managerial",
                      expanded: false,
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  // companyChart = [
  //   {
  //     id: 1,
  //     name: "Talent",
  //     number_employees: "1 - 50",
  //     firstNode: true,
  //     type: "company",
  //     expanded: false,
  //     children: [
  //       {
  //         id: 2,
  //         name: "Department A",
  //         type: "department",
  //         code: "DEP-001",
  //         expanded: false,
  //         children: []
  //       },
  //       {
  //         id: 3,
  //         name: "Department B",
  //         type: "department",
  //         code: "DEP-002",
  //         expanded: false,
  //         children: []
  //       }
  //     ]
  //   }
  // ];

  // chartData = {
  //   name: 'Aya Emad',
  //   position: 'CEO',
  //   jobTitleCode: 101,
  //   level: 'Executive',
  //   expanded: true,
  //   firstNode: true,
  //   children: [
  //     {
  //       name: 'Laila Mohamed',
  //       position: 'CFO',
  //       jobTitleCode: 102,
  //       level: 'Senior Management',
  //       expanded: true,
  //       children: [
  //         { name: 'Mostafa Khaled', position: 'Accountant', jobTitleCode: 201, level: 'Staff', expanded: false, children: [] },
  //         { name: 'Sara Nabil', position: 'Financial Analyst', jobTitleCode: 202, level: 'Staff', expanded: false, children: [] }
  //       ]
  //     },
  //   ]
  // };


  chartData = {
    name: "Employee 2",
    position: "CFO",
    jobTitleCode: 101,
    level: "Executive",
    expanded: true,
    children: [
      {
        name: "Employee 3",
        position: "Head of Operations",
        jobTitleCode: 102,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 4",
            position: "Team Lead",
            jobTitleCode: 103,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 5",
                position: "Analyst",
                jobTitleCode: 104,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 6",
                position: "Developer",
                jobTitleCode: 105,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 7",
                position: "Developer",
                jobTitleCode: 106,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 8",
                position: "Consultant",
                jobTitleCode: 107,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 9",
                position: "Developer",
                jobTitleCode: 108,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 10",
            position: "Project Manager",
            jobTitleCode: 109,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 11",
                position: "Accountant",
                jobTitleCode: 110,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 12",
                position: "Engineer",
                jobTitleCode: 111,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 13",
                position: "Analyst",
                jobTitleCode: 112,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 14",
                position: "Developer",
                jobTitleCode: 113,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 15",
                position: "Consultant",
                jobTitleCode: 114,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 16",
            position: "Product Manager",
            jobTitleCode: 115,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 17",
                position: "Consultant",
                jobTitleCode: 116,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 18",
                position: "Accountant",
                jobTitleCode: 117,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 19",
                position: "Developer",
                jobTitleCode: 118,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 20",
                position: "Consultant",
                jobTitleCode: 119,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 21",
                position: "Accountant",
                jobTitleCode: 120,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 22",
            position: "Project Manager",
            jobTitleCode: 121,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 23",
                position: "Designer",
                jobTitleCode: 122,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 24",
                position: "Developer",
                jobTitleCode: 123,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 25",
                position: "Designer",
                jobTitleCode: 124,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 26",
        position: "Head of Operations",
        jobTitleCode: 125,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 27",
            position: "Product Manager",
            jobTitleCode: 126,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 28",
                position: "Developer",
                jobTitleCode: 127,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 29",
                position: "Engineer",
                jobTitleCode: 128,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 30",
                position: "Designer",
                jobTitleCode: 129,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 31",
                position: "Developer",
                jobTitleCode: 130,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 32",
                position: "Analyst",
                jobTitleCode: 131,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 33",
            position: "Product Manager",
            jobTitleCode: 132,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 34",
                position: "Accountant",
                jobTitleCode: 133,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 35",
                position: "Developer",
                jobTitleCode: 134,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 36",
                position: "Accountant",
                jobTitleCode: 135,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 37",
        position: "Director",
        jobTitleCode: 136,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 38",
            position: "Manager",
            jobTitleCode: 137,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 39",
                position: "Developer",
                jobTitleCode: 138,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 40",
                position: "Analyst",
                jobTitleCode: 139,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 41",
                position: "Accountant",
                jobTitleCode: 140,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 42",
                position: "Analyst",
                jobTitleCode: 141,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 43",
                position: "Engineer",
                jobTitleCode: 142,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 44",
            position: "Manager",
            jobTitleCode: 143,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 45",
                position: "Accountant",
                jobTitleCode: 144,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 46",
                position: "Consultant",
                jobTitleCode: 145,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 47",
                position: "Analyst",
                jobTitleCode: 146,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 48",
                position: "Developer",
                jobTitleCode: 147,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 49",
                position: "Developer",
                jobTitleCode: 148,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 50",
            position: "Project Manager",
            jobTitleCode: 149,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 51",
                position: "Accountant",
                jobTitleCode: 150,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 52",
                position: "Designer",
                jobTitleCode: 151,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 53",
                position: "Accountant",
                jobTitleCode: 152,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 54",
            position: "Project Manager",
            jobTitleCode: 153,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 55",
                position: "Consultant",
                jobTitleCode: 154,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 56",
                position: "Designer",
                jobTitleCode: 155,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 57",
                position: "Accountant",
                jobTitleCode: 156,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 58",
        position: "Head of Operations",
        jobTitleCode: 157,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 59",
            position: "Product Manager",
            jobTitleCode: 158,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 60",
                position: "Designer",
                jobTitleCode: 159,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 61",
                position: "Designer",
                jobTitleCode: 160,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 62",
                position: "Designer",
                jobTitleCode: 161,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 63",
                position: "Consultant",
                jobTitleCode: 162,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 64",
                position: "Developer",
                jobTitleCode: 163,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 65",
            position: "Product Manager",
            jobTitleCode: 164,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 66",
                position: "Developer",
                jobTitleCode: 165,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 67",
                position: "Designer",
                jobTitleCode: 166,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 68",
                position: "Analyst",
                jobTitleCode: 167,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 69",
            position: "Team Lead",
            jobTitleCode: 168,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 70",
                position: "Engineer",
                jobTitleCode: 169,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 71",
                position: "Engineer",
                jobTitleCode: 170,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 72",
        position: "Director",
        jobTitleCode: 171,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 73",
            position: "Manager",
            jobTitleCode: 172,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 74",
                position: "Developer",
                jobTitleCode: 173,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 75",
                position: "Analyst",
                jobTitleCode: 174,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 76",
            position: "Manager",
            jobTitleCode: 175,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 77",
                position: "Analyst",
                jobTitleCode: 176,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 78",
                position: "Designer",
                jobTitleCode: 177,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 79",
                position: "Engineer",
                jobTitleCode: 178,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 80",
                position: "Developer",
                jobTitleCode: 179,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 81",
            position: "Project Manager",
            jobTitleCode: 180,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 82",
                position: "Consultant",
                jobTitleCode: 181,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 83",
                position: "Designer",
                jobTitleCode: 182,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 84",
                position: "Analyst",
                jobTitleCode: 183,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 85",
            position: "Manager",
            jobTitleCode: 184,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 86",
                position: "Accountant",
                jobTitleCode: 185,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 87",
                position: "Accountant",
                jobTitleCode: 186,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 88",
                position: "Analyst",
                jobTitleCode: 187,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 89",
                position: "Accountant",
                jobTitleCode: 188,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 90",
                position: "Analyst",
                jobTitleCode: 189,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 91",
        position: "VP of Sales",
        jobTitleCode: 190,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 92",
            position: "Manager",
            jobTitleCode: 191,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 93",
                position: "Developer",
                jobTitleCode: 192,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 94",
                position: "Designer",
                jobTitleCode: 193,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 95",
                position: "Accountant",
                jobTitleCode: 194,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 96",
                position: "Analyst",
                jobTitleCode: 195,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 97",
            position: "Product Manager",
            jobTitleCode: 196,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 98",
                position: "Analyst",
                jobTitleCode: 197,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 99",
                position: "Analyst",
                jobTitleCode: 198,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 100",
                position: "Designer",
                jobTitleCode: 199,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 101",
                position: "Analyst",
                jobTitleCode: 200,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 102",
            position: "Product Manager",
            jobTitleCode: 201,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 103",
                position: "Designer",
                jobTitleCode: 202,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 104",
                position: "Engineer",
                jobTitleCode: 203,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 105",
                position: "Designer",
                jobTitleCode: 204,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 106",
                position: "Designer",
                jobTitleCode: 205,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 107",
                position: "Designer",
                jobTitleCode: 206,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 108",
            position: "Team Lead",
            jobTitleCode: 207,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 109",
                position: "Designer",
                jobTitleCode: 208,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 110",
                position: "Engineer",
                jobTitleCode: 209,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 111",
                position: "Developer",
                jobTitleCode: 210,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 112",
                position: "Accountant",
                jobTitleCode: 211,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 113",
                position: "Developer",
                jobTitleCode: 212,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 114",
        position: "Head of Operations",
        jobTitleCode: 213,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 115",
            position: "Project Manager",
            jobTitleCode: 214,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 116",
                position: "Engineer",
                jobTitleCode: 215,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 117",
                position: "Analyst",
                jobTitleCode: 216,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 118",
                position: "Engineer",
                jobTitleCode: 217,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 119",
                position: "Engineer",
                jobTitleCode: 218,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 120",
            position: "Project Manager",
            jobTitleCode: 219,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 121",
                position: "Consultant",
                jobTitleCode: 220,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 122",
                position: "Accountant",
                jobTitleCode: 221,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 123",
                position: "Designer",
                jobTitleCode: 222,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 124",
            position: "Project Manager",
            jobTitleCode: 223,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 125",
                position: "Designer",
                jobTitleCode: 224,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 126",
                position: "Accountant",
                jobTitleCode: 225,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 127",
                position: "Engineer",
                jobTitleCode: 226,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 128",
                position: "Accountant",
                jobTitleCode: 227,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 129",
                position: "Designer",
                jobTitleCode: 228,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 130",
            position: "Product Manager",
            jobTitleCode: 229,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 131",
                position: "Accountant",
                jobTitleCode: 230,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 132",
                position: "Consultant",
                jobTitleCode: 231,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 133",
                position: "Analyst",
                jobTitleCode: 232,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 134",
                position: "Accountant",
                jobTitleCode: 233,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 135",
            position: "Manager",
            jobTitleCode: 234,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 136",
                position: "Designer",
                jobTitleCode: 235,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 137",
                position: "Accountant",
                jobTitleCode: 236,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 138",
                position: "Developer",
                jobTitleCode: 237,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 139",
                position: "Accountant",
                jobTitleCode: 238,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 140",
                position: "Developer",
                jobTitleCode: 239,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 141",
        position: "VP of Marketing",
        jobTitleCode: 240,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 142",
            position: "Manager",
            jobTitleCode: 241,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 143",
                position: "Analyst",
                jobTitleCode: 242,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 144",
                position: "Engineer",
                jobTitleCode: 243,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 145",
            position: "Team Lead",
            jobTitleCode: 244,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 146",
                position: "Accountant",
                jobTitleCode: 245,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 147",
                position: "Developer",
                jobTitleCode: 246,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 148",
                position: "Consultant",
                jobTitleCode: 247,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 149",
        position: "Head of Operations",
        jobTitleCode: 248,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 150",
            position: "Product Manager",
            jobTitleCode: 249,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 151",
                position: "Consultant",
                jobTitleCode: 250,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 152",
                position: "Developer",
                jobTitleCode: 251,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 153",
                position: "Accountant",
                jobTitleCode: 252,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 154",
                position: "Accountant",
                jobTitleCode: 253,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 155",
            position: "Project Manager",
            jobTitleCode: 254,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 156",
                position: "Analyst",
                jobTitleCode: 255,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 157",
                position: "Consultant",
                jobTitleCode: 256,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 158",
        position: "Head of Operations",
        jobTitleCode: 257,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 159",
            position: "Project Manager",
            jobTitleCode: 258,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 160",
                position: "Designer",
                jobTitleCode: 259,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 161",
                position: "Analyst",
                jobTitleCode: 260,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 162",
                position: "Engineer",
                jobTitleCode: 261,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 163",
                position: "Analyst",
                jobTitleCode: 262,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 164",
            position: "Team Lead",
            jobTitleCode: 263,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 165",
                position: "Engineer",
                jobTitleCode: 264,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 166",
                position: "Consultant",
                jobTitleCode: 265,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 167",
                position: "Consultant",
                jobTitleCode: 266,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 168",
        position: "VP of Marketing",
        jobTitleCode: 267,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 169",
            position: "Project Manager",
            jobTitleCode: 268,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 170",
                position: "Accountant",
                jobTitleCode: 269,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 171",
                position: "Designer",
                jobTitleCode: 270,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 172",
                position: "Accountant",
                jobTitleCode: 271,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 173",
                position: "Developer",
                jobTitleCode: 272,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 174",
            position: "Project Manager",
            jobTitleCode: 273,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 175",
                position: "Consultant",
                jobTitleCode: 274,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 176",
                position: "Accountant",
                jobTitleCode: 275,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 177",
                position: "Analyst",
                jobTitleCode: 276,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 178",
        position: "Director",
        jobTitleCode: 277,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 179",
            position: "Project Manager",
            jobTitleCode: 278,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 180",
                position: "Accountant",
                jobTitleCode: 279,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 181",
                position: "Accountant",
                jobTitleCode: 280,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 182",
            position: "Product Manager",
            jobTitleCode: 281,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 183",
                position: "Analyst",
                jobTitleCode: 282,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 184",
                position: "Analyst",
                jobTitleCode: 283,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 185",
                position: "Accountant",
                jobTitleCode: 284,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 186",
                position: "Consultant",
                jobTitleCode: 285,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 187",
            position: "Project Manager",
            jobTitleCode: 286,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 188",
                position: "Developer",
                jobTitleCode: 287,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 189",
                position: "Designer",
                jobTitleCode: 288,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 190",
                position: "Engineer",
                jobTitleCode: 289,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 191",
                position: "Developer",
                jobTitleCode: 290,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 192",
            position: "Manager",
            jobTitleCode: 291,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 193",
                position: "Accountant",
                jobTitleCode: 292,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 194",
                position: "Analyst",
                jobTitleCode: 293,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 195",
            position: "Team Lead",
            jobTitleCode: 294,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 196",
                position: "Developer",
                jobTitleCode: 295,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 197",
                position: "Designer",
                jobTitleCode: 296,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 198",
                position: "Designer",
                jobTitleCode: 297,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 199",
        position: "Director",
        jobTitleCode: 298,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 200",
            position: "Product Manager",
            jobTitleCode: 299,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 201",
                position: "Designer",
                jobTitleCode: 300,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 202",
                position: "Consultant",
                jobTitleCode: 301,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 203",
                position: "Accountant",
                jobTitleCode: 302,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 204",
            position: "Product Manager",
            jobTitleCode: 303,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 205",
                position: "Analyst",
                jobTitleCode: 304,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 206",
                position: "Engineer",
                jobTitleCode: 305,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 207",
                position: "Developer",
                jobTitleCode: 306,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 208",
            position: "Manager",
            jobTitleCode: 307,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 209",
                position: "Accountant",
                jobTitleCode: 308,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 210",
                position: "Developer",
                jobTitleCode: 309,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 211",
                position: "Engineer",
                jobTitleCode: 310,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 212",
        position: "Head of Operations",
        jobTitleCode: 311,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 213",
            position: "Team Lead",
            jobTitleCode: 312,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 214",
                position: "Accountant",
                jobTitleCode: 313,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 215",
                position: "Consultant",
                jobTitleCode: 314,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 216",
                position: "Developer",
                jobTitleCode: 315,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 217",
                position: "Engineer",
                jobTitleCode: 316,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 218",
                position: "Analyst",
                jobTitleCode: 317,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 219",
            position: "Team Lead",
            jobTitleCode: 318,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 220",
                position: "Developer",
                jobTitleCode: 319,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 221",
                position: "Accountant",
                jobTitleCode: 320,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 222",
                position: "Consultant",
                jobTitleCode: 321,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 223",
                position: "Engineer",
                jobTitleCode: 322,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 224",
            position: "Project Manager",
            jobTitleCode: 323,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 225",
                position: "Analyst",
                jobTitleCode: 324,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 226",
                position: "Designer",
                jobTitleCode: 325,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 227",
                position: "Engineer",
                jobTitleCode: 326,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 228",
                position: "Designer",
                jobTitleCode: 327,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 229",
                position: "Designer",
                jobTitleCode: 328,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 230",
            position: "Product Manager",
            jobTitleCode: 329,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 231",
                position: "Accountant",
                jobTitleCode: 330,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 232",
                position: "Designer",
                jobTitleCode: 331,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 233",
                position: "Accountant",
                jobTitleCode: 332,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 234",
                position: "Accountant",
                jobTitleCode: 333,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 235",
        position: "Director",
        jobTitleCode: 334,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 236",
            position: "Product Manager",
            jobTitleCode: 335,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 237",
                position: "Engineer",
                jobTitleCode: 336,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 238",
                position: "Engineer",
                jobTitleCode: 337,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 239",
                position: "Analyst",
                jobTitleCode: 338,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 240",
                position: "Designer",
                jobTitleCode: 339,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 241",
            position: "Manager",
            jobTitleCode: 340,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 242",
                position: "Accountant",
                jobTitleCode: 341,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 243",
                position: "Developer",
                jobTitleCode: 342,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 244",
                position: "Engineer",
                jobTitleCode: 343,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 245",
                position: "Accountant",
                jobTitleCode: 344,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 246",
        position: "VP of Marketing",
        jobTitleCode: 345,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 247",
            position: "Project Manager",
            jobTitleCode: 346,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 248",
                position: "Accountant",
                jobTitleCode: 347,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 249",
                position: "Engineer",
                jobTitleCode: 348,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 250",
            position: "Product Manager",
            jobTitleCode: 349,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 251",
                position: "Consultant",
                jobTitleCode: 350,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 252",
                position: "Developer",
                jobTitleCode: 351,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 253",
            position: "Product Manager",
            jobTitleCode: 352,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 254",
                position: "Accountant",
                jobTitleCode: 353,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 255",
                position: "Engineer",
                jobTitleCode: 354,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 256",
                position: "Accountant",
                jobTitleCode: 355,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 257",
        position: "Head of Operations",
        jobTitleCode: 356,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 258",
            position: "Project Manager",
            jobTitleCode: 357,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 259",
                position: "Engineer",
                jobTitleCode: 358,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 260",
                position: "Analyst",
                jobTitleCode: 359,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 261",
                position: "Analyst",
                jobTitleCode: 360,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 262",
                position: "Developer",
                jobTitleCode: 361,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 263",
                position: "Analyst",
                jobTitleCode: 362,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 264",
            position: "Team Lead",
            jobTitleCode: 363,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 265",
                position: "Engineer",
                jobTitleCode: 364,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 266",
                position: "Consultant",
                jobTitleCode: 365,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 267",
        position: "Director",
        jobTitleCode: 366,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 268",
            position: "Project Manager",
            jobTitleCode: 367,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 269",
                position: "Developer",
                jobTitleCode: 368,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 270",
                position: "Designer",
                jobTitleCode: 369,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 271",
                position: "Analyst",
                jobTitleCode: 370,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 272",
            position: "Manager",
            jobTitleCode: 371,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 273",
                position: "Consultant",
                jobTitleCode: 372,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 274",
                position: "Engineer",
                jobTitleCode: 373,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 275",
                position: "Analyst",
                jobTitleCode: 374,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 276",
            position: "Team Lead",
            jobTitleCode: 375,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 277",
                position: "Consultant",
                jobTitleCode: 376,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 278",
                position: "Engineer",
                jobTitleCode: 377,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 279",
            position: "Manager",
            jobTitleCode: 378,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 280",
                position: "Consultant",
                jobTitleCode: 379,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 281",
                position: "Consultant",
                jobTitleCode: 380,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 282",
        position: "Director",
        jobTitleCode: 381,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 283",
            position: "Product Manager",
            jobTitleCode: 382,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 284",
                position: "Analyst",
                jobTitleCode: 383,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 285",
                position: "Analyst",
                jobTitleCode: 384,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 286",
            position: "Manager",
            jobTitleCode: 385,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 287",
                position: "Designer",
                jobTitleCode: 386,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 288",
                position: "Engineer",
                jobTitleCode: 387,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 289",
                position: "Developer",
                jobTitleCode: 388,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 290",
                position: "Designer",
                jobTitleCode: 389,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 291",
            position: "Product Manager",
            jobTitleCode: 390,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 292",
                position: "Consultant",
                jobTitleCode: 391,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 293",
                position: "Consultant",
                jobTitleCode: 392,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 294",
            position: "Product Manager",
            jobTitleCode: 393,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 295",
                position: "Consultant",
                jobTitleCode: 394,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 296",
                position: "Analyst",
                jobTitleCode: 395,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 297",
        position: "Head of Operations",
        jobTitleCode: 396,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 298",
            position: "Product Manager",
            jobTitleCode: 397,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 299",
                position: "Designer",
                jobTitleCode: 398,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 300",
                position: "Designer",
                jobTitleCode: 399,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 301",
                position: "Designer",
                jobTitleCode: 400,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 302",
            position: "Team Lead",
            jobTitleCode: 401,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 303",
                position: "Analyst",
                jobTitleCode: 402,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 304",
                position: "Analyst",
                jobTitleCode: 403,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 305",
                position: "Developer",
                jobTitleCode: 404,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 306",
                position: "Consultant",
                jobTitleCode: 405,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 307",
            position: "Team Lead",
            jobTitleCode: 406,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 308",
                position: "Consultant",
                jobTitleCode: 407,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 309",
                position: "Analyst",
                jobTitleCode: 408,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 310",
        position: "Head of Operations",
        jobTitleCode: 409,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 311",
            position: "Team Lead",
            jobTitleCode: 410,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 312",
                position: "Accountant",
                jobTitleCode: 411,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 313",
                position: "Consultant",
                jobTitleCode: 412,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 314",
                position: "Accountant",
                jobTitleCode: 413,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 315",
                position: "Accountant",
                jobTitleCode: 414,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 316",
            position: "Product Manager",
            jobTitleCode: 415,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 317",
                position: "Developer",
                jobTitleCode: 416,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 318",
                position: "Consultant",
                jobTitleCode: 417,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 319",
        position: "VP of Marketing",
        jobTitleCode: 418,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 320",
            position: "Product Manager",
            jobTitleCode: 419,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 321",
                position: "Analyst",
                jobTitleCode: 420,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 322",
                position: "Consultant",
                jobTitleCode: 421,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 323",
                position: "Designer",
                jobTitleCode: 422,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 324",
                position: "Consultant",
                jobTitleCode: 423,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 325",
            position: "Product Manager",
            jobTitleCode: 424,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 326",
                position: "Analyst",
                jobTitleCode: 425,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 327",
                position: "Developer",
                jobTitleCode: 426,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 328",
                position: "Analyst",
                jobTitleCode: 427,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 329",
                position: "Developer",
                jobTitleCode: 428,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 330",
                position: "Designer",
                jobTitleCode: 429,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 331",
            position: "Project Manager",
            jobTitleCode: 430,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 332",
                position: "Analyst",
                jobTitleCode: 431,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 333",
                position: "Consultant",
                jobTitleCode: 432,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 334",
                position: "Analyst",
                jobTitleCode: 433,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 335",
            position: "Project Manager",
            jobTitleCode: 434,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 336",
                position: "Consultant",
                jobTitleCode: 435,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 337",
                position: "Developer",
                jobTitleCode: 436,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 338",
                position: "Engineer",
                jobTitleCode: 437,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 339",
            position: "Product Manager",
            jobTitleCode: 438,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 340",
                position: "Consultant",
                jobTitleCode: 439,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 341",
                position: "Accountant",
                jobTitleCode: 440,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 342",
                position: "Accountant",
                jobTitleCode: 441,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 343",
        position: "Head of Operations",
        jobTitleCode: 442,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 344",
            position: "Project Manager",
            jobTitleCode: 443,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 345",
                position: "Designer",
                jobTitleCode: 444,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 346",
                position: "Developer",
                jobTitleCode: 445,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 347",
                position: "Designer",
                jobTitleCode: 446,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 348",
                position: "Accountant",
                jobTitleCode: 447,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 349",
                position: "Designer",
                jobTitleCode: 448,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 350",
            position: "Project Manager",
            jobTitleCode: 449,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 351",
                position: "Engineer",
                jobTitleCode: 450,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 352",
                position: "Accountant",
                jobTitleCode: 451,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 353",
                position: "Analyst",
                jobTitleCode: 452,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 354",
            position: "Project Manager",
            jobTitleCode: 453,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 355",
                position: "Consultant",
                jobTitleCode: 454,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 356",
                position: "Accountant",
                jobTitleCode: 455,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 357",
                position: "Consultant",
                jobTitleCode: 456,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 358",
                position: "Designer",
                jobTitleCode: 457,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 359",
                position: "Accountant",
                jobTitleCode: 458,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 360",
            position: "Project Manager",
            jobTitleCode: 459,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 361",
                position: "Designer",
                jobTitleCode: 460,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 362",
                position: "Engineer",
                jobTitleCode: 461,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 363",
                position: "Designer",
                jobTitleCode: 462,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 364",
                position: "Designer",
                jobTitleCode: 463,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 365",
                position: "Accountant",
                jobTitleCode: 464,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 366",
        position: "VP of Sales",
        jobTitleCode: 465,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 367",
            position: "Manager",
            jobTitleCode: 466,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 368",
                position: "Designer",
                jobTitleCode: 467,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 369",
                position: "Consultant",
                jobTitleCode: 468,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 370",
                position: "Designer",
                jobTitleCode: 469,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 371",
                position: "Consultant",
                jobTitleCode: 470,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 372",
            position: "Product Manager",
            jobTitleCode: 471,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 373",
                position: "Analyst",
                jobTitleCode: 472,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 374",
                position: "Engineer",
                jobTitleCode: 473,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 375",
                position: "Accountant",
                jobTitleCode: 474,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 376",
                position: "Consultant",
                jobTitleCode: 475,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 377",
                position: "Consultant",
                jobTitleCode: 476,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 378",
            position: "Manager",
            jobTitleCode: 477,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 379",
                position: "Engineer",
                jobTitleCode: 478,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 380",
                position: "Accountant",
                jobTitleCode: 479,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 381",
                position: "Designer",
                jobTitleCode: 480,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 382",
            position: "Team Lead",
            jobTitleCode: 481,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 383",
                position: "Designer",
                jobTitleCode: 482,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 384",
                position: "Engineer",
                jobTitleCode: 483,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 385",
                position: "Consultant",
                jobTitleCode: 484,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 386",
                position: "Engineer",
                jobTitleCode: 485,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 387",
        position: "VP of Sales",
        jobTitleCode: 486,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 388",
            position: "Team Lead",
            jobTitleCode: 487,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 389",
                position: "Designer",
                jobTitleCode: 488,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 390",
                position: "Developer",
                jobTitleCode: 489,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 391",
            position: "Manager",
            jobTitleCode: 490,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 392",
                position: "Consultant",
                jobTitleCode: 491,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 393",
                position: "Engineer",
                jobTitleCode: 492,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 394",
                position: "Consultant",
                jobTitleCode: 493,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 395",
            position: "Team Lead",
            jobTitleCode: 494,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 396",
                position: "Designer",
                jobTitleCode: 495,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 397",
                position: "Engineer",
                jobTitleCode: 496,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 398",
            position: "Product Manager",
            jobTitleCode: 497,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 399",
                position: "Engineer",
                jobTitleCode: 498,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 400",
                position: "Accountant",
                jobTitleCode: 499,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 401",
        position: "Director",
        jobTitleCode: 500,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 402",
            position: "Manager",
            jobTitleCode: 501,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 403",
                position: "Designer",
                jobTitleCode: 502,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 404",
                position: "Developer",
                jobTitleCode: 503,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 405",
                position: "Designer",
                jobTitleCode: 504,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 406",
                position: "Engineer",
                jobTitleCode: 505,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 407",
            position: "Project Manager",
            jobTitleCode: 506,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 408",
                position: "Engineer",
                jobTitleCode: 507,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 409",
                position: "Developer",
                jobTitleCode: 508,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 410",
                position: "Consultant",
                jobTitleCode: 509,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 411",
                position: "Designer",
                jobTitleCode: 510,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 412",
            position: "Product Manager",
            jobTitleCode: 511,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 413",
                position: "Accountant",
                jobTitleCode: 512,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 414",
                position: "Accountant",
                jobTitleCode: 513,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 415",
                position: "Accountant",
                jobTitleCode: 514,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 416",
                position: "Consultant",
                jobTitleCode: 515,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 417",
                position: "Consultant",
                jobTitleCode: 516,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 418",
            position: "Product Manager",
            jobTitleCode: 517,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 419",
                position: "Analyst",
                jobTitleCode: 518,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 420",
                position: "Developer",
                jobTitleCode: 519,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 421",
                position: "Accountant",
                jobTitleCode: 520,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 422",
                position: "Consultant",
                jobTitleCode: 521,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 423",
            position: "Team Lead",
            jobTitleCode: 522,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 424",
                position: "Engineer",
                jobTitleCode: 523,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 425",
                position: "Engineer",
                jobTitleCode: 524,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 426",
                position: "Engineer",
                jobTitleCode: 525,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 427",
                position: "Accountant",
                jobTitleCode: 526,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 428",
                position: "Accountant",
                jobTitleCode: 527,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 429",
        position: "VP of Marketing",
        jobTitleCode: 528,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 430",
            position: "Product Manager",
            jobTitleCode: 529,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 431",
                position: "Engineer",
                jobTitleCode: 530,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 432",
                position: "Engineer",
                jobTitleCode: 531,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 433",
            position: "Product Manager",
            jobTitleCode: 532,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 434",
                position: "Analyst",
                jobTitleCode: 533,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 435",
                position: "Accountant",
                jobTitleCode: 534,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 436",
        position: "Head of Operations",
        jobTitleCode: 535,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 437",
            position: "Project Manager",
            jobTitleCode: 536,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 438",
                position: "Analyst",
                jobTitleCode: 537,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 439",
                position: "Analyst",
                jobTitleCode: 538,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 440",
                position: "Engineer",
                jobTitleCode: 539,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 441",
            position: "Manager",
            jobTitleCode: 540,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 442",
                position: "Designer",
                jobTitleCode: 541,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 443",
                position: "Developer",
                jobTitleCode: 542,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 444",
                position: "Designer",
                jobTitleCode: 543,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 445",
                position: "Developer",
                jobTitleCode: 544,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 446",
                position: "Consultant",
                jobTitleCode: 545,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 447",
            position: "Product Manager",
            jobTitleCode: 546,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 448",
                position: "Developer",
                jobTitleCode: 547,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 449",
                position: "Developer",
                jobTitleCode: 548,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 450",
                position: "Designer",
                jobTitleCode: 549,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 451",
                position: "Developer",
                jobTitleCode: 550,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 452",
                position: "Designer",
                jobTitleCode: 551,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 453",
            position: "Product Manager",
            jobTitleCode: 552,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 454",
                position: "Analyst",
                jobTitleCode: 553,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 455",
                position: "Engineer",
                jobTitleCode: 554,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 456",
                position: "Engineer",
                jobTitleCode: 555,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 457",
                position: "Accountant",
                jobTitleCode: 556,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 458",
                position: "Developer",
                jobTitleCode: 557,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 459",
            position: "Product Manager",
            jobTitleCode: 558,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 460",
                position: "Designer",
                jobTitleCode: 559,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 461",
                position: "Engineer",
                jobTitleCode: 560,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 462",
                position: "Designer",
                jobTitleCode: 561,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 463",
                position: "Consultant",
                jobTitleCode: 562,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 464",
                position: "Accountant",
                jobTitleCode: 563,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 465",
        position: "Head of Operations",
        jobTitleCode: 564,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 466",
            position: "Manager",
            jobTitleCode: 565,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 467",
                position: "Analyst",
                jobTitleCode: 566,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 468",
                position: "Consultant",
                jobTitleCode: 567,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 469",
                position: "Consultant",
                jobTitleCode: 568,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 470",
                position: "Analyst",
                jobTitleCode: 569,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 471",
                position: "Designer",
                jobTitleCode: 570,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 472",
            position: "Project Manager",
            jobTitleCode: 571,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 473",
                position: "Accountant",
                jobTitleCode: 572,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 474",
                position: "Developer",
                jobTitleCode: 573,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 475",
                position: "Engineer",
                jobTitleCode: 574,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 476",
                position: "Developer",
                jobTitleCode: 575,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 477",
            position: "Project Manager",
            jobTitleCode: 576,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 478",
                position: "Designer",
                jobTitleCode: 577,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 479",
                position: "Analyst",
                jobTitleCode: 578,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 480",
                position: "Analyst",
                jobTitleCode: 579,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 481",
                position: "Designer",
                jobTitleCode: 580,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 482",
                position: "Accountant",
                jobTitleCode: 581,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 483",
            position: "Team Lead",
            jobTitleCode: 582,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 484",
                position: "Consultant",
                jobTitleCode: 583,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 485",
                position: "Designer",
                jobTitleCode: 584,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 486",
                position: "Consultant",
                jobTitleCode: 585,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 487",
            position: "Product Manager",
            jobTitleCode: 586,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 488",
                position: "Engineer",
                jobTitleCode: 587,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 489",
                position: "Designer",
                jobTitleCode: 588,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 490",
                position: "Analyst",
                jobTitleCode: 589,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 491",
        position: "VP of Sales",
        jobTitleCode: 590,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 492",
            position: "Product Manager",
            jobTitleCode: 591,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 493",
                position: "Accountant",
                jobTitleCode: 592,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 494",
                position: "Consultant",
                jobTitleCode: 593,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 495",
            position: "Product Manager",
            jobTitleCode: 594,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 496",
                position: "Engineer",
                jobTitleCode: 595,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 497",
                position: "Engineer",
                jobTitleCode: 596,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 498",
                position: "Developer",
                jobTitleCode: 597,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 499",
            position: "Project Manager",
            jobTitleCode: 598,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 500",
                position: "Consultant",
                jobTitleCode: 599,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 501",
                position: "Developer",
                jobTitleCode: 600,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 502",
                position: "Designer",
                jobTitleCode: 601,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 503",
            position: "Project Manager",
            jobTitleCode: 602,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 504",
                position: "Accountant",
                jobTitleCode: 603,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 505",
                position: "Consultant",
                jobTitleCode: 604,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 506",
                position: "Designer",
                jobTitleCode: 605,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 507",
        position: "Director",
        jobTitleCode: 606,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 508",
            position: "Project Manager",
            jobTitleCode: 607,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 509",
                position: "Consultant",
                jobTitleCode: 608,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 510",
                position: "Accountant",
                jobTitleCode: 609,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 511",
                position: "Designer",
                jobTitleCode: 610,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 512",
                position: "Developer",
                jobTitleCode: 611,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 513",
            position: "Project Manager",
            jobTitleCode: 612,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 514",
                position: "Analyst",
                jobTitleCode: 613,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 515",
                position: "Consultant",
                jobTitleCode: 614,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 516",
                position: "Consultant",
                jobTitleCode: 615,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 517",
                position: "Accountant",
                jobTitleCode: 616,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 518",
                position: "Developer",
                jobTitleCode: 617,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 519",
            position: "Team Lead",
            jobTitleCode: 618,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 520",
                position: "Accountant",
                jobTitleCode: 619,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 521",
                position: "Analyst",
                jobTitleCode: 620,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 522",
                position: "Developer",
                jobTitleCode: 621,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 523",
        position: "VP of Sales",
        jobTitleCode: 622,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 524",
            position: "Product Manager",
            jobTitleCode: 623,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 525",
                position: "Accountant",
                jobTitleCode: 624,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 526",
                position: "Consultant",
                jobTitleCode: 625,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 527",
                position: "Designer",
                jobTitleCode: 626,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 528",
                position: "Engineer",
                jobTitleCode: 627,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 529",
                position: "Accountant",
                jobTitleCode: 628,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 530",
            position: "Project Manager",
            jobTitleCode: 629,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 531",
                position: "Designer",
                jobTitleCode: 630,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 532",
                position: "Analyst",
                jobTitleCode: 631,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 533",
            position: "Team Lead",
            jobTitleCode: 632,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 534",
                position: "Engineer",
                jobTitleCode: 633,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 535",
                position: "Engineer",
                jobTitleCode: 634,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 536",
                position: "Designer",
                jobTitleCode: 635,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 537",
                position: "Accountant",
                jobTitleCode: 636,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 538",
            position: "Team Lead",
            jobTitleCode: 637,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 539",
                position: "Accountant",
                jobTitleCode: 638,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 540",
                position: "Analyst",
                jobTitleCode: 639,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 541",
                position: "Engineer",
                jobTitleCode: 640,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 542",
                position: "Accountant",
                jobTitleCode: 641,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 543",
            position: "Product Manager",
            jobTitleCode: 642,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 544",
                position: "Analyst",
                jobTitleCode: 643,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 545",
                position: "Engineer",
                jobTitleCode: 644,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 546",
                position: "Engineer",
                jobTitleCode: 645,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 547",
        position: "Director",
        jobTitleCode: 646,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 548",
            position: "Product Manager",
            jobTitleCode: 647,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 549",
                position: "Engineer",
                jobTitleCode: 648,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 550",
                position: "Designer",
                jobTitleCode: 649,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 551",
            position: "Manager",
            jobTitleCode: 650,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 552",
                position: "Developer",
                jobTitleCode: 651,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 553",
                position: "Consultant",
                jobTitleCode: 652,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 554",
                position: "Designer",
                jobTitleCode: 653,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 555",
            position: "Product Manager",
            jobTitleCode: 654,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 556",
                position: "Consultant",
                jobTitleCode: 655,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 557",
                position: "Consultant",
                jobTitleCode: 656,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 558",
            position: "Team Lead",
            jobTitleCode: 657,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 559",
                position: "Accountant",
                jobTitleCode: 658,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 560",
                position: "Designer",
                jobTitleCode: 659,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 561",
                position: "Accountant",
                jobTitleCode: 660,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 562",
        position: "VP of Marketing",
        jobTitleCode: 661,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 563",
            position: "Manager",
            jobTitleCode: 662,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 564",
                position: "Consultant",
                jobTitleCode: 663,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 565",
                position: "Consultant",
                jobTitleCode: 664,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 566",
                position: "Developer",
                jobTitleCode: 665,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 567",
                position: "Developer",
                jobTitleCode: 666,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 568",
            position: "Manager",
            jobTitleCode: 667,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 569",
                position: "Engineer",
                jobTitleCode: 668,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 570",
                position: "Accountant",
                jobTitleCode: 669,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 571",
                position: "Designer",
                jobTitleCode: 670,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 572",
                position: "Accountant",
                jobTitleCode: 671,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 573",
                position: "Consultant",
                jobTitleCode: 672,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 574",
            position: "Project Manager",
            jobTitleCode: 673,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 575",
                position: "Designer",
                jobTitleCode: 674,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 576",
                position: "Engineer",
                jobTitleCode: 675,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 577",
                position: "Analyst",
                jobTitleCode: 676,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 578",
            position: "Project Manager",
            jobTitleCode: 677,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 579",
                position: "Designer",
                jobTitleCode: 678,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 580",
                position: "Designer",
                jobTitleCode: 679,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 581",
                position: "Analyst",
                jobTitleCode: 680,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 582",
                position: "Developer",
                jobTitleCode: 681,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 583",
        position: "VP of Sales",
        jobTitleCode: 682,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 584",
            position: "Product Manager",
            jobTitleCode: 683,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 585",
                position: "Consultant",
                jobTitleCode: 684,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 586",
                position: "Analyst",
                jobTitleCode: 685,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 587",
                position: "Analyst",
                jobTitleCode: 686,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 588",
                position: "Designer",
                jobTitleCode: 687,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 589",
            position: "Project Manager",
            jobTitleCode: 688,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 590",
                position: "Engineer",
                jobTitleCode: 689,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 591",
                position: "Consultant",
                jobTitleCode: 690,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 592",
            position: "Team Lead",
            jobTitleCode: 691,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 593",
                position: "Developer",
                jobTitleCode: 692,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 594",
                position: "Consultant",
                jobTitleCode: 693,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 595",
                position: "Consultant",
                jobTitleCode: 694,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 596",
                position: "Accountant",
                jobTitleCode: 695,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 597",
        position: "VP of Sales",
        jobTitleCode: 696,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 598",
            position: "Team Lead",
            jobTitleCode: 697,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 599",
                position: "Consultant",
                jobTitleCode: 698,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 600",
                position: "Analyst",
                jobTitleCode: 699,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 601",
            position: "Team Lead",
            jobTitleCode: 700,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 602",
                position: "Analyst",
                jobTitleCode: 701,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 603",
                position: "Analyst",
                jobTitleCode: 702,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 604",
                position: "Developer",
                jobTitleCode: 703,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 605",
                position: "Analyst",
                jobTitleCode: 704,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 606",
            position: "Team Lead",
            jobTitleCode: 705,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 607",
                position: "Designer",
                jobTitleCode: 706,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 608",
                position: "Designer",
                jobTitleCode: 707,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 609",
                position: "Developer",
                jobTitleCode: 708,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 610",
                position: "Accountant",
                jobTitleCode: 709,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 611",
                position: "Developer",
                jobTitleCode: 710,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 612",
            position: "Product Manager",
            jobTitleCode: 711,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 613",
                position: "Engineer",
                jobTitleCode: 712,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 614",
                position: "Engineer",
                jobTitleCode: 713,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 615",
            position: "Team Lead",
            jobTitleCode: 714,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 616",
                position: "Developer",
                jobTitleCode: 715,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 617",
                position: "Designer",
                jobTitleCode: 716,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 618",
                position: "Accountant",
                jobTitleCode: 717,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 619",
        position: "VP of Marketing",
        jobTitleCode: 718,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 620",
            position: "Product Manager",
            jobTitleCode: 719,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 621",
                position: "Designer",
                jobTitleCode: 720,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 622",
                position: "Accountant",
                jobTitleCode: 721,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 623",
                position: "Consultant",
                jobTitleCode: 722,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 624",
            position: "Product Manager",
            jobTitleCode: 723,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 625",
                position: "Engineer",
                jobTitleCode: 724,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 626",
                position: "Consultant",
                jobTitleCode: 725,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 627",
                position: "Engineer",
                jobTitleCode: 726,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 628",
            position: "Project Manager",
            jobTitleCode: 727,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 629",
                position: "Analyst",
                jobTitleCode: 728,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 630",
                position: "Designer",
                jobTitleCode: 729,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 631",
                position: "Consultant",
                jobTitleCode: 730,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 632",
            position: "Team Lead",
            jobTitleCode: 731,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 633",
                position: "Analyst",
                jobTitleCode: 732,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 634",
                position: "Designer",
                jobTitleCode: 733,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 635",
                position: "Designer",
                jobTitleCode: 734,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 636",
                position: "Designer",
                jobTitleCode: 735,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 637",
                position: "Designer",
                jobTitleCode: 736,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 638",
        position: "Director",
        jobTitleCode: 737,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 639",
            position: "Manager",
            jobTitleCode: 738,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 640",
                position: "Consultant",
                jobTitleCode: 739,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 641",
                position: "Accountant",
                jobTitleCode: 740,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 642",
            position: "Team Lead",
            jobTitleCode: 741,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 643",
                position: "Consultant",
                jobTitleCode: 742,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 644",
                position: "Developer",
                jobTitleCode: 743,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 645",
            position: "Manager",
            jobTitleCode: 744,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 646",
                position: "Analyst",
                jobTitleCode: 745,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 647",
                position: "Consultant",
                jobTitleCode: 746,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 648",
                position: "Designer",
                jobTitleCode: 747,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 649",
                position: "Analyst",
                jobTitleCode: 748,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 650",
            position: "Manager",
            jobTitleCode: 749,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 651",
                position: "Analyst",
                jobTitleCode: 750,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 652",
                position: "Accountant",
                jobTitleCode: 751,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 653",
                position: "Analyst",
                jobTitleCode: 752,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 654",
            position: "Manager",
            jobTitleCode: 753,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 655",
                position: "Engineer",
                jobTitleCode: 754,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 656",
                position: "Developer",
                jobTitleCode: 755,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 657",
                position: "Developer",
                jobTitleCode: 756,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 658",
                position: "Accountant",
                jobTitleCode: 757,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 659",
        position: "VP of Marketing",
        jobTitleCode: 758,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 660",
            position: "Manager",
            jobTitleCode: 759,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 661",
                position: "Engineer",
                jobTitleCode: 760,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 662",
                position: "Developer",
                jobTitleCode: 761,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 663",
                position: "Engineer",
                jobTitleCode: 762,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 664",
                position: "Developer",
                jobTitleCode: 763,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 665",
                position: "Developer",
                jobTitleCode: 764,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 666",
            position: "Product Manager",
            jobTitleCode: 765,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 667",
                position: "Engineer",
                jobTitleCode: 766,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 668",
                position: "Developer",
                jobTitleCode: 767,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 669",
                position: "Designer",
                jobTitleCode: 768,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 670",
                position: "Developer",
                jobTitleCode: 769,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 671",
                position: "Consultant",
                jobTitleCode: 770,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 672",
            position: "Project Manager",
            jobTitleCode: 771,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 673",
                position: "Consultant",
                jobTitleCode: 772,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 674",
                position: "Designer",
                jobTitleCode: 773,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 675",
            position: "Team Lead",
            jobTitleCode: 774,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 676",
                position: "Consultant",
                jobTitleCode: 775,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 677",
                position: "Developer",
                jobTitleCode: 776,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 678",
                position: "Accountant",
                jobTitleCode: 777,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 679",
            position: "Project Manager",
            jobTitleCode: 778,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 680",
                position: "Analyst",
                jobTitleCode: 779,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 681",
                position: "Consultant",
                jobTitleCode: 780,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 682",
        position: "Director",
        jobTitleCode: 781,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 683",
            position: "Team Lead",
            jobTitleCode: 782,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 684",
                position: "Engineer",
                jobTitleCode: 783,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 685",
                position: "Consultant",
                jobTitleCode: 784,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 686",
            position: "Project Manager",
            jobTitleCode: 785,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 687",
                position: "Developer",
                jobTitleCode: 786,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 688",
                position: "Accountant",
                jobTitleCode: 787,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 689",
                position: "Accountant",
                jobTitleCode: 788,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 690",
        position: "VP of Sales",
        jobTitleCode: 789,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 691",
            position: "Product Manager",
            jobTitleCode: 790,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 692",
                position: "Engineer",
                jobTitleCode: 791,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 693",
                position: "Designer",
                jobTitleCode: 792,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 694",
            position: "Product Manager",
            jobTitleCode: 793,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 695",
                position: "Analyst",
                jobTitleCode: 794,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 696",
                position: "Consultant",
                jobTitleCode: 795,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 697",
                position: "Designer",
                jobTitleCode: 796,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 698",
                position: "Consultant",
                jobTitleCode: 797,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 699",
                position: "Accountant",
                jobTitleCode: 798,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 700",
            position: "Team Lead",
            jobTitleCode: 799,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 701",
                position: "Designer",
                jobTitleCode: 800,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 702",
                position: "Accountant",
                jobTitleCode: 801,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 703",
                position: "Engineer",
                jobTitleCode: 802,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 704",
            position: "Team Lead",
            jobTitleCode: 803,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 705",
                position: "Consultant",
                jobTitleCode: 804,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 706",
                position: "Accountant",
                jobTitleCode: 805,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 707",
            position: "Project Manager",
            jobTitleCode: 806,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 708",
                position: "Engineer",
                jobTitleCode: 807,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 709",
                position: "Designer",
                jobTitleCode: 808,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 710",
                position: "Engineer",
                jobTitleCode: 809,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 711",
                position: "Developer",
                jobTitleCode: 810,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 712",
                position: "Consultant",
                jobTitleCode: 811,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 713",
        position: "Director",
        jobTitleCode: 812,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 714",
            position: "Project Manager",
            jobTitleCode: 813,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 715",
                position: "Accountant",
                jobTitleCode: 814,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 716",
                position: "Engineer",
                jobTitleCode: 815,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 717",
                position: "Analyst",
                jobTitleCode: 816,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 718",
                position: "Engineer",
                jobTitleCode: 817,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 719",
                position: "Designer",
                jobTitleCode: 818,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 720",
            position: "Team Lead",
            jobTitleCode: 819,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 721",
                position: "Consultant",
                jobTitleCode: 820,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 722",
                position: "Analyst",
                jobTitleCode: 821,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 723",
            position: "Product Manager",
            jobTitleCode: 822,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 724",
                position: "Accountant",
                jobTitleCode: 823,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 725",
                position: "Engineer",
                jobTitleCode: 824,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 726",
                position: "Accountant",
                jobTitleCode: 825,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 727",
                position: "Accountant",
                jobTitleCode: 826,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 728",
        position: "Director",
        jobTitleCode: 827,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 729",
            position: "Project Manager",
            jobTitleCode: 828,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 730",
                position: "Consultant",
                jobTitleCode: 829,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 731",
                position: "Accountant",
                jobTitleCode: 830,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 732",
                position: "Engineer",
                jobTitleCode: 831,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 733",
                position: "Accountant",
                jobTitleCode: 832,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 734",
                position: "Developer",
                jobTitleCode: 833,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 735",
            position: "Manager",
            jobTitleCode: 834,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 736",
                position: "Consultant",
                jobTitleCode: 835,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 737",
                position: "Developer",
                jobTitleCode: 836,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 738",
                position: "Engineer",
                jobTitleCode: 837,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 739",
                position: "Accountant",
                jobTitleCode: 838,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 740",
            position: "Manager",
            jobTitleCode: 839,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 741",
                position: "Accountant",
                jobTitleCode: 840,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 742",
                position: "Engineer",
                jobTitleCode: 841,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 743",
                position: "Accountant",
                jobTitleCode: 842,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 744",
                position: "Accountant",
                jobTitleCode: 843,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 745",
            position: "Product Manager",
            jobTitleCode: 844,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 746",
                position: "Developer",
                jobTitleCode: 845,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 747",
                position: "Developer",
                jobTitleCode: 846,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 748",
                position: "Engineer",
                jobTitleCode: 847,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 749",
        position: "VP of Marketing",
        jobTitleCode: 848,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 750",
            position: "Project Manager",
            jobTitleCode: 849,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 751",
                position: "Consultant",
                jobTitleCode: 850,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 752",
                position: "Designer",
                jobTitleCode: 851,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 753",
                position: "Analyst",
                jobTitleCode: 852,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 754",
                position: "Developer",
                jobTitleCode: 853,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 755",
                position: "Accountant",
                jobTitleCode: 854,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 756",
            position: "Product Manager",
            jobTitleCode: 855,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 757",
                position: "Consultant",
                jobTitleCode: 856,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 758",
                position: "Developer",
                jobTitleCode: 857,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 759",
                position: "Designer",
                jobTitleCode: 858,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 760",
                position: "Accountant",
                jobTitleCode: 859,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 761",
                position: "Engineer",
                jobTitleCode: 860,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 762",
            position: "Product Manager",
            jobTitleCode: 861,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 763",
                position: "Consultant",
                jobTitleCode: 862,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 764",
                position: "Accountant",
                jobTitleCode: 863,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 765",
                position: "Consultant",
                jobTitleCode: 864,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 766",
        position: "Director",
        jobTitleCode: 865,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 767",
            position: "Team Lead",
            jobTitleCode: 866,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 768",
                position: "Developer",
                jobTitleCode: 867,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 769",
                position: "Accountant",
                jobTitleCode: 868,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 770",
            position: "Product Manager",
            jobTitleCode: 869,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 771",
                position: "Designer",
                jobTitleCode: 870,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 772",
                position: "Engineer",
                jobTitleCode: 871,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 773",
                position: "Engineer",
                jobTitleCode: 872,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 774",
                position: "Engineer",
                jobTitleCode: 873,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 775",
                position: "Accountant",
                jobTitleCode: 874,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 776",
            position: "Product Manager",
            jobTitleCode: 875,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 777",
                position: "Accountant",
                jobTitleCode: 876,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 778",
                position: "Analyst",
                jobTitleCode: 877,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 779",
                position: "Developer",
                jobTitleCode: 878,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 780",
                position: "Developer",
                jobTitleCode: 879,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 781",
            position: "Product Manager",
            jobTitleCode: 880,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 782",
                position: "Consultant",
                jobTitleCode: 881,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 783",
                position: "Developer",
                jobTitleCode: 882,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 784",
                position: "Accountant",
                jobTitleCode: 883,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 785",
                position: "Analyst",
                jobTitleCode: 884,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 786",
                position: "Designer",
                jobTitleCode: 885,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 787",
            position: "Product Manager",
            jobTitleCode: 886,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 788",
                position: "Consultant",
                jobTitleCode: 887,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 789",
                position: "Consultant",
                jobTitleCode: 888,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 790",
                position: "Accountant",
                jobTitleCode: 889,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 791",
        position: "VP of Sales",
        jobTitleCode: 890,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 792",
            position: "Product Manager",
            jobTitleCode: 891,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 793",
                position: "Consultant",
                jobTitleCode: 892,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 794",
                position: "Analyst",
                jobTitleCode: 893,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 795",
                position: "Accountant",
                jobTitleCode: 894,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 796",
                position: "Analyst",
                jobTitleCode: 895,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 797",
                position: "Analyst",
                jobTitleCode: 896,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 798",
            position: "Project Manager",
            jobTitleCode: 897,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 799",
                position: "Designer",
                jobTitleCode: 898,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 800",
                position: "Consultant",
                jobTitleCode: 899,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 801",
                position: "Accountant",
                jobTitleCode: 900,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 802",
                position: "Engineer",
                jobTitleCode: 901,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 803",
            position: "Project Manager",
            jobTitleCode: 902,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 804",
                position: "Accountant",
                jobTitleCode: 903,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 805",
                position: "Designer",
                jobTitleCode: 904,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 806",
                position: "Consultant",
                jobTitleCode: 905,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 807",
        position: "Head of Operations",
        jobTitleCode: 906,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 808",
            position: "Project Manager",
            jobTitleCode: 907,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 809",
                position: "Developer",
                jobTitleCode: 908,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 810",
                position: "Developer",
                jobTitleCode: 909,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 811",
                position: "Analyst",
                jobTitleCode: 910,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 812",
                position: "Consultant",
                jobTitleCode: 911,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 813",
            position: "Manager",
            jobTitleCode: 912,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 814",
                position: "Developer",
                jobTitleCode: 913,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 815",
                position: "Developer",
                jobTitleCode: 914,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 816",
                position: "Accountant",
                jobTitleCode: 915,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 817",
                position: "Analyst",
                jobTitleCode: 916,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 818",
                position: "Analyst",
                jobTitleCode: 917,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 819",
            position: "Manager",
            jobTitleCode: 918,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 820",
                position: "Consultant",
                jobTitleCode: 919,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 821",
                position: "Consultant",
                jobTitleCode: 920,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 822",
                position: "Designer",
                jobTitleCode: 921,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 823",
            position: "Project Manager",
            jobTitleCode: 922,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 824",
                position: "Developer",
                jobTitleCode: 923,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 825",
                position: "Analyst",
                jobTitleCode: 924,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 826",
        position: "Director",
        jobTitleCode: 925,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 827",
            position: "Product Manager",
            jobTitleCode: 926,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 828",
                position: "Designer",
                jobTitleCode: 927,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 829",
                position: "Designer",
                jobTitleCode: 928,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 830",
                position: "Accountant",
                jobTitleCode: 929,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 831",
            position: "Product Manager",
            jobTitleCode: 930,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 832",
                position: "Developer",
                jobTitleCode: 931,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 833",
                position: "Engineer",
                jobTitleCode: 932,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 834",
                position: "Consultant",
                jobTitleCode: 933,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 835",
            position: "Team Lead",
            jobTitleCode: 934,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 836",
                position: "Analyst",
                jobTitleCode: 935,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 837",
                position: "Analyst",
                jobTitleCode: 936,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 838",
            position: "Team Lead",
            jobTitleCode: 937,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 839",
                position: "Designer",
                jobTitleCode: 938,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 840",
                position: "Designer",
                jobTitleCode: 939,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 841",
                position: "Analyst",
                jobTitleCode: 940,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 842",
            position: "Product Manager",
            jobTitleCode: 941,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 843",
                position: "Analyst",
                jobTitleCode: 942,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 844",
                position: "Accountant",
                jobTitleCode: 943,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 845",
                position: "Accountant",
                jobTitleCode: 944,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 846",
        position: "Head of Operations",
        jobTitleCode: 945,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 847",
            position: "Project Manager",
            jobTitleCode: 946,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 848",
                position: "Engineer",
                jobTitleCode: 947,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 849",
                position: "Analyst",
                jobTitleCode: 948,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 850",
                position: "Consultant",
                jobTitleCode: 949,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 851",
                position: "Engineer",
                jobTitleCode: 950,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 852",
                position: "Designer",
                jobTitleCode: 951,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 853",
            position: "Project Manager",
            jobTitleCode: 952,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 854",
                position: "Consultant",
                jobTitleCode: 953,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 855",
                position: "Engineer",
                jobTitleCode: 954,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 856",
                position: "Accountant",
                jobTitleCode: 955,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 857",
                position: "Analyst",
                jobTitleCode: 956,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 858",
            position: "Project Manager",
            jobTitleCode: 957,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 859",
                position: "Accountant",
                jobTitleCode: 958,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 860",
                position: "Analyst",
                jobTitleCode: 959,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 861",
        position: "Director",
        jobTitleCode: 960,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 862",
            position: "Project Manager",
            jobTitleCode: 961,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 863",
                position: "Consultant",
                jobTitleCode: 962,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 864",
                position: "Designer",
                jobTitleCode: 963,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 865",
                position: "Designer",
                jobTitleCode: 964,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 866",
            position: "Team Lead",
            jobTitleCode: 965,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 867",
                position: "Analyst",
                jobTitleCode: 966,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 868",
                position: "Designer",
                jobTitleCode: 967,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 869",
                position: "Accountant",
                jobTitleCode: 968,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 870",
            position: "Project Manager",
            jobTitleCode: 969,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 871",
                position: "Engineer",
                jobTitleCode: 970,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 872",
                position: "Analyst",
                jobTitleCode: 971,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 873",
        position: "VP of Sales",
        jobTitleCode: 972,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 874",
            position: "Manager",
            jobTitleCode: 973,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 875",
                position: "Designer",
                jobTitleCode: 974,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 876",
                position: "Consultant",
                jobTitleCode: 975,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 877",
                position: "Designer",
                jobTitleCode: 976,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 878",
                position: "Engineer",
                jobTitleCode: 977,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 879",
            position: "Product Manager",
            jobTitleCode: 978,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 880",
                position: "Accountant",
                jobTitleCode: 979,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 881",
                position: "Engineer",
                jobTitleCode: 980,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 882",
                position: "Engineer",
                jobTitleCode: 981,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 883",
                position: "Accountant",
                jobTitleCode: 982,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 884",
                position: "Developer",
                jobTitleCode: 983,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 885",
            position: "Manager",
            jobTitleCode: 984,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 886",
                position: "Consultant",
                jobTitleCode: 985,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 887",
                position: "Analyst",
                jobTitleCode: 986,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 888",
                position: "Consultant",
                jobTitleCode: 987,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 889",
            position: "Team Lead",
            jobTitleCode: 988,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 890",
                position: "Developer",
                jobTitleCode: 989,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 891",
                position: "Accountant",
                jobTitleCode: 990,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 892",
        position: "VP of Marketing",
        jobTitleCode: 991,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 893",
            position: "Team Lead",
            jobTitleCode: 992,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 894",
                position: "Designer",
                jobTitleCode: 993,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 895",
                position: "Analyst",
                jobTitleCode: 994,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 896",
            position: "Project Manager",
            jobTitleCode: 995,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 897",
                position: "Consultant",
                jobTitleCode: 996,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 898",
                position: "Developer",
                jobTitleCode: 997,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 899",
                position: "Engineer",
                jobTitleCode: 998,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 900",
            position: "Product Manager",
            jobTitleCode: 999,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 901",
                position: "Engineer",
                jobTitleCode: 1000,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 902",
                position: "Developer",
                jobTitleCode: 1001,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 903",
                position: "Designer",
                jobTitleCode: 1002,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 904",
            position: "Product Manager",
            jobTitleCode: 1003,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 905",
                position: "Developer",
                jobTitleCode: 1004,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 906",
                position: "Consultant",
                jobTitleCode: 1005,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 907",
                position: "Developer",
                jobTitleCode: 1006,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 908",
        position: "Head of Operations",
        jobTitleCode: 1007,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 909",
            position: "Project Manager",
            jobTitleCode: 1008,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 910",
                position: "Developer",
                jobTitleCode: 1009,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 911",
                position: "Engineer",
                jobTitleCode: 1010,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 912",
                position: "Engineer",
                jobTitleCode: 1011,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 913",
                position: "Developer",
                jobTitleCode: 1012,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 914",
            position: "Product Manager",
            jobTitleCode: 1013,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 915",
                position: "Engineer",
                jobTitleCode: 1014,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 916",
                position: "Accountant",
                jobTitleCode: 1015,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 917",
                position: "Designer",
                jobTitleCode: 1016,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 918",
                position: "Analyst",
                jobTitleCode: 1017,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 919",
                position: "Consultant",
                jobTitleCode: 1018,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 920",
            position: "Manager",
            jobTitleCode: 1019,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 921",
                position: "Designer",
                jobTitleCode: 1020,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 922",
                position: "Analyst",
                jobTitleCode: 1021,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 923",
                position: "Developer",
                jobTitleCode: 1022,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 924",
                position: "Analyst",
                jobTitleCode: 1023,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 925",
                position: "Engineer",
                jobTitleCode: 1024,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 926",
            position: "Product Manager",
            jobTitleCode: 1025,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 927",
                position: "Analyst",
                jobTitleCode: 1026,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 928",
                position: "Analyst",
                jobTitleCode: 1027,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 929",
                position: "Developer",
                jobTitleCode: 1028,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 930",
                position: "Engineer",
                jobTitleCode: 1029,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 931",
            position: "Project Manager",
            jobTitleCode: 1030,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 932",
                position: "Consultant",
                jobTitleCode: 1031,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 933",
                position: "Designer",
                jobTitleCode: 1032,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 934",
                position: "Designer",
                jobTitleCode: 1033,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 935",
                position: "Designer",
                jobTitleCode: 1034,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 936",
        position: "VP of Marketing",
        jobTitleCode: 1035,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 937",
            position: "Project Manager",
            jobTitleCode: 1036,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 938",
                position: "Consultant",
                jobTitleCode: 1037,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 939",
                position: "Consultant",
                jobTitleCode: 1038,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 940",
                position: "Analyst",
                jobTitleCode: 1039,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 941",
                position: "Designer",
                jobTitleCode: 1040,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 942",
                position: "Analyst",
                jobTitleCode: 1041,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 943",
            position: "Product Manager",
            jobTitleCode: 1042,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 944",
                position: "Designer",
                jobTitleCode: 1043,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 945",
                position: "Designer",
                jobTitleCode: 1044,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 946",
                position: "Developer",
                jobTitleCode: 1045,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 947",
                position: "Consultant",
                jobTitleCode: 1046,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 948",
            position: "Project Manager",
            jobTitleCode: 1047,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 949",
                position: "Developer",
                jobTitleCode: 1048,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 950",
                position: "Developer",
                jobTitleCode: 1049,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 951",
                position: "Engineer",
                jobTitleCode: 1050,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 952",
                position: "Consultant",
                jobTitleCode: 1051,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 953",
                position: "Consultant",
                jobTitleCode: 1052,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 954",
            position: "Project Manager",
            jobTitleCode: 1053,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 955",
                position: "Engineer",
                jobTitleCode: 1054,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 956",
                position: "Designer",
                jobTitleCode: 1055,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 957",
                position: "Engineer",
                jobTitleCode: 1056,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 958",
                position: "Accountant",
                jobTitleCode: 1057,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 959",
        position: "Director",
        jobTitleCode: 1058,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 960",
            position: "Product Manager",
            jobTitleCode: 1059,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 961",
                position: "Accountant",
                jobTitleCode: 1060,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 962",
                position: "Analyst",
                jobTitleCode: 1061,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 963",
                position: "Designer",
                jobTitleCode: 1062,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 964",
                position: "Consultant",
                jobTitleCode: 1063,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 965",
            position: "Project Manager",
            jobTitleCode: 1064,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 966",
                position: "Accountant",
                jobTitleCode: 1065,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 967",
                position: "Developer",
                jobTitleCode: 1066,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 968",
            position: "Product Manager",
            jobTitleCode: 1067,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 969",
                position: "Developer",
                jobTitleCode: 1068,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 970",
                position: "Accountant",
                jobTitleCode: 1069,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 971",
        position: "Head of Operations",
        jobTitleCode: 1070,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 972",
            position: "Manager",
            jobTitleCode: 1071,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 973",
                position: "Analyst",
                jobTitleCode: 1072,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 974",
                position: "Consultant",
                jobTitleCode: 1073,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 975",
                position: "Engineer",
                jobTitleCode: 1074,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 976",
            position: "Team Lead",
            jobTitleCode: 1075,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 977",
                position: "Developer",
                jobTitleCode: 1076,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 978",
                position: "Analyst",
                jobTitleCode: 1077,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 979",
                position: "Engineer",
                jobTitleCode: 1078,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 980",
                position: "Accountant",
                jobTitleCode: 1079,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 981",
            position: "Product Manager",
            jobTitleCode: 1080,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 982",
                position: "Accountant",
                jobTitleCode: 1081,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 983",
                position: "Consultant",
                jobTitleCode: 1082,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 984",
                position: "Engineer",
                jobTitleCode: 1083,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 985",
                position: "Designer",
                jobTitleCode: 1084,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 986",
            position: "Manager",
            jobTitleCode: 1085,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 987",
                position: "Engineer",
                jobTitleCode: 1086,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 988",
                position: "Consultant",
                jobTitleCode: 1087,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 989",
                position: "Developer",
                jobTitleCode: 1088,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 990",
                position: "Consultant",
                jobTitleCode: 1089,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 991",
                position: "Analyst",
                jobTitleCode: 1090,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: "Employee 992",
        position: "VP of Marketing",
        jobTitleCode: 1091,
        level: "Senior Management",
        expanded: true,
        children: [
          {
            name: "Employee 993",
            position: "Project Manager",
            jobTitleCode: 1092,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 994",
                position: "Consultant",
                jobTitleCode: 1093,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 995",
                position: "Developer",
                jobTitleCode: 1094,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 996",
            position: "Project Manager",
            jobTitleCode: 1095,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 997",
                position: "Developer",
                jobTitleCode: 1096,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 998",
                position: "Engineer",
                jobTitleCode: 1097,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 999",
                position: "Engineer",
                jobTitleCode: 1098,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 1000",
            position: "Manager",
            jobTitleCode: 1099,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 1001",
                position: "Accountant",
                jobTitleCode: 1100,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1002",
                position: "Consultant",
                jobTitleCode: 1101,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1003",
                position: "Analyst",
                jobTitleCode: 1102,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1004",
                position: "Analyst",
                jobTitleCode: 1103,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 1005",
            position: "Team Lead",
            jobTitleCode: 1104,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 1006",
                position: "Analyst",
                jobTitleCode: 1105,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1007",
                position: "Accountant",
                jobTitleCode: 1106,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1008",
                position: "Engineer",
                jobTitleCode: 1107,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1009",
                position: "Accountant",
                jobTitleCode: 1108,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          },
          {
            name: "Employee 1010",
            position: "Product Manager",
            jobTitleCode: 1109,
            level: "Middle Management",
            expanded: false,
            children: [
              {
                name: "Employee 1011",
                position: "Developer",
                jobTitleCode: 1110,
                level: "Staff",
                expanded: false,
                children: []
              },
              {
                name: "Employee 1012",
                position: "Developer",
                jobTitleCode: 1111,
                level: "Staff",
                expanded: false,
                children: []
              }
            ]
          }
        ]
      }
    ]
  }


  ngAfterViewInit(): void {
    const iframe = this.orgChartFrame.nativeElement;
    iframe.onload = () => {
      console.log('Iframe loaded. Ready to receive messages via postMessage');
      this.sendDataToIframe();
    };
  }

  sendDataToIframe(): void {
    const iframe = this.orgChartFrame.nativeElement;
    if (iframe && iframe.contentWindow) {
      const message = {
        action: 'setData',              // must match expected action
        payload: this.chartData,        // use "payload" instead of "data"
        chartType: 'chartData'           // must send chartType as companyChart or orgChart based on the data in component
      };
      console.log('Sending data to iframe:', message);
      iframe.contentWindow.postMessage(
        message,
        'https://orgchart.talentdot.org'
      );
    }
  }


  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
    const bodyElement = document.querySelector('.body');
    const sidenav = document.querySelector('.sidenav');
    const htmlElement = document.documentElement;
    const btnFixed = document.querySelector('.btn-fixed') as HTMLElement;
    if (bodyElement) {
      if (this.isFullScreen) {
        bodyElement.classList.add('body-full');
        if (sidenav) {
          sidenav.classList.add('sidenav-hidden');
        }
        htmlElement.style.setProperty('zoom', '1', 'important');
        if (btnFixed) {
          btnFixed.style.setProperty('zoom', '0.85', 'important');
        }
      } else {
        bodyElement.classList.remove('body-full');
        if (sidenav) {
          sidenav.classList.remove('sidenav-hidden');
        }
        htmlElement.style.removeProperty('zoom');
        if (btnFixed) {
          btnFixed.style.removeProperty('zoom');
        }
      }
    }
  }


}
